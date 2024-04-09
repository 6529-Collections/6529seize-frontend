import Image from "next/image";

export default function NothingHereYetSummer() {
  return (
    <>
      <Image
        priority
        loading="eager"
        width="0"
        height="100"
        style={{ height: "auto", width: "100px" }}
        src="/SummerGlasses.svg"
        alt="SummerGlasses"
      />{" "}
      <b>Nothing here yet</b>
    </>
  );
}
