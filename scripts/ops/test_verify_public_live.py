#!/usr/bin/env python3
"""Offline regression for active-paper public verification; no HTTP or orders."""
from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.dont_write_bytecode = True
import verify_public_live as V


def fixture():
    return {
        "ledgerIdentity": "RECONSTRUCTED_PAPER_TEST",
        "officialSequence": 66,
        "dailyLedger": [{"date": "2026-09-18", "runStatus": "COMPLETED"}],
    }


def served(evidence, seq=66, source_sha=None):
    return {
        "priceAsOf": "2026-09-18", "priceFreshnessStatus": "WARNING_CACHED",
        "priceStaleTradingDays": 1,
        "magicOfficialSummary": {
            "officialSequence": seq, "sourceStateSha256": (
                evidence["sourceStateSha256"] if source_sha is None else source_sha),
            "dataDate": "2026-09-18", "officialAvailableCash": 0,
            "openItemLotCount": 500, "totalCash": 5, "holdingsMarketValue": 10,
            "totalAsset": 15,
        },
        "magicOfficialPortfolio": {"holdings": [{"ticker": "fixture"}]},
        "magicOfficialTradeDays": [{"date": "2026-09-18", "buyCount": 10,
                                    "sellCount": 10}],
    }


class ActiveLedgerEvidenceTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="wababa-live-verify-test-")
        root = Path(self.temp.name)
        self.active = root / "active.json"
        self.source = root / "source.json"
        self.original = root / "original.json"
        self.active.write_text(json.dumps(fixture()), encoding="utf-8")
        self.source.write_text(json.dumps(fixture()), encoding="utf-8")
        self.original.write_text(json.dumps({"officialSequence": 43}), encoding="utf-8")
        self.original_sha = hashlib.sha256(self.original.read_bytes()).hexdigest()

    def tearDown(self):
        self.temp.cleanup()

    def evidence(self):
        return V._active_ledger_evidence(
            active_path=self.active, source_path=self.source,
            original_path=self.original, expected_original_sha=self.original_sha)

    def test_preserved_43_active_66_served_66_passes_without_changing_original(self):
        before = hashlib.sha256(self.original.read_bytes()).hexdigest()
        evidence = self.evidence()
        checks = V.verify_payload(served(evidence), evidence)["checks"]
        self.assertTrue(all(checks.values()), checks)
        self.assertEqual(evidence["officialSequence"], 66)
        self.assertEqual(before, hashlib.sha256(self.original.read_bytes()).hexdigest())

    def test_served_43_is_not_current_active_paper(self):
        evidence = self.evidence()
        checks = V.verify_payload(served(evidence, seq=43), evidence)["checks"]
        self.assertFalse(checks["publicSeqMatchesCanonical"])

    def test_source_hash_mismatch_fails_even_when_sequence_matches(self):
        evidence = self.evidence()
        checks = V.verify_payload(served(evidence, source_sha="0" * 64), evidence)["checks"]
        self.assertFalse(checks["publicSourceMatchesActiveLedger"])

    def test_none_never_equals_none_for_success(self):
        checks = V.verify_payload(served({"sourceStateSha256": "0" * 64}, seq=None,
                                         source_sha=None), None)["checks"]
        self.assertFalse(checks["publicSeqMatchesCanonical"])
        self.assertFalse(checks["publicSourceMatchesActiveLedger"])
        self.assertFalse(checks["activeLedgerIdentityVerified"])

    def test_missing_or_malformed_active_fails_closed(self):
        self.active.unlink()
        with self.assertRaises(OSError):
            self.evidence()
        self.active.write_text("{not-json", encoding="utf-8")
        with self.assertRaises(ValueError):
            self.evidence()

    def test_ledger_identity_mismatch_fails_closed(self):
        other = fixture()
        other["ledgerIdentity"] = "OTHER_LEDGER"
        self.source.write_text(json.dumps(other), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "identity mismatch"):
            self.evidence()

    def test_preserved_original_hash_change_fails_closed(self):
        self.original.write_text(json.dumps({"officialSequence": 44}), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "original hash changed"):
            self.evidence()

    def test_live_ok_means_deploy_integrity_not_freshness_or_hold_release(self):
        evidence = self.evidence()
        payload = served(evidence)
        blob = json.dumps(payload).encode("utf-8")
        html = ("장부 기준일 2026.09.18 평가가격 기준일 2026.09.18 "
                "최신 장부 반영 완료").encode("utf-8")

        def fetch(url, _attempt):
            return (200, blob) if "/data/" in url else (200, html)

        with patch.object(V, "_active_ledger_evidence", return_value=evidence), \
             patch.object(V, "_committed_blob", return_value=blob), \
             patch.object(V, "_fetch", side_effect=fetch), \
             patch.object(V, "_hold_decision", return_value="HOLD"):
            result = V.run(timeout_sec=0, interval_sec=0)
        self.assertEqual(result["status"], "LIVE_OK")
        self.assertEqual(result["expectedSha256"], result["servedSha256"])
        self.assertEqual(result["sourceWarnings"],
                         ["PRICE_FRESHNESS_NOT_PASS", "MAGIC_PAPER_HOLD"])
        self.assertEqual(result["priceStaleTradingDays"], 1)
        self.assertEqual(result["magicPaperLaneDecision"], "HOLD")
        wrapper = (Path(__file__).parent / "publish-public-data.ps1").read_text(
            encoding="utf-8-sig")
        self.assertIn("priceFreshnessStatus", wrapper)
        self.assertIn("applyGateDecision", wrapper)

    def test_missing_active_stops_before_network(self):
        with patch.object(V, "_active_ledger_evidence", side_effect=FileNotFoundError), \
             patch.object(V, "_committed_blob", side_effect=AssertionError("unexpected blob read")), \
             patch.object(V, "_fetch", side_effect=AssertionError("unexpected HTTP")):
            result = V.run()
        self.assertEqual(result["status"], "BLOCKED_ACTIVE_LEDGER_EVIDENCE_INVALID")
        self.assertEqual(result["filesWritten"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
