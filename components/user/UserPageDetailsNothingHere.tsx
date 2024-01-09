import Image from "next/image";

export default function UserPageDetailsNothingHere() {
  return (
    <span className="d-flex align-items-center gap-2">
      <Image
        width="0"
        height="0"
        style={{ height: "auto", width: "60px" }}
        src="/SummerGlasses.svg"
        alt="SummerGlasses"
      />
      No results found
    </span>
  );
}
