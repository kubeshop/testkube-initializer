import logoUrl from "../assets/testkube-symbol-color.svg";

export default function Logo({ height = 43 }: { height?: number }) {
  return (
    <img
      src={logoUrl}
      alt="Testkube"
      height={height}
      width={Math.round((height * 35) / 43)}
      className="block shrink-0"
    />
  );
}
