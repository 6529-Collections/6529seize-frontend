import Image from "next/image";

export default function UserPageDetailsNothingHere() {
  return (
    <>
      <Image
        width="0"
        height="0"
        style={{ height: "auto", width: "100px" }}
        src="/SummerGlasses.svg"
        alt="SummerGlasses"
      />{" "}
      Nothing here yet
    </>
  );
}
