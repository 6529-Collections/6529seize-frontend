import { useEffect } from "react";
import { useRouter } from "next/router";

const DeeplinkPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Extract the index from the dynamic route segment
    const target = router.query.index as string;

    // Construct the deep link URL for your app
    const deepLink = `mobileStaging6529://${target}`;

    // Redirect to the app using the custom scheme
    if (target) {
      window.location.href = deepLink;

      // Optional fallback for users without the app installed
      setTimeout(() => {
        window.location.href = "https://staging.seize.io/download";
      }, 5000); // Adjust delay as needed
    }
  }, [router.query.index]);

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{
        height: "100vh",
      }}>
      <h1>Redirecting...</h1>
      <p>
        If you&apos;re not redirected,{" "}
        <a href={`mobileStaging6529://${router.query.index}`}>click here</a>.
      </p>
    </div>
  );
};

export default DeeplinkPage;
