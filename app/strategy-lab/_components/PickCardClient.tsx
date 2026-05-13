"use client";

type Props = {
  code: string;
  name: string;
  style: any;
};

export default function PickCardClient({ code, name, style }: Props) {
  return (
    <button
      onClick={() => {
        try {
          const prev = JSON.parse(localStorage.getItem("wababa-skipped") || "[]");

          const exists = prev.find((p: any) => p.code === code);

          if (!exists) {
            const updated = [{ code, name }, ...prev];
            localStorage.setItem("wababa-skipped", JSON.stringify(updated));
          }

          window.location.reload();
        } catch (e) {
          console.error(e);
        }
      }}
      style={{
        width: "100%",
        minHeight: 34,
        borderRadius: 12,
        background: "#ffffff",
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: 13,
        fontWeight: 950,
        cursor: "pointer",
      }}
    >
      넘기기
    </button>
  );
}