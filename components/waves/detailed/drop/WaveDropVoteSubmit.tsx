import { useState, useEffect } from "react";
import mojs from "@mojs/core";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import styles from "./VoteButton.module.scss";

export default function WaveDropVoteSubmit() {
  const [animationTimeline, setAnimationTimeline] = useState<any>(null);
  const [triangleBurst, setTriangleBurst] = useState<any>(null);
  const [circleBurst, setCircleBurst] = useState<any>(null);
  const [smallBurst, setSmallBurst] = useState<any>(null);
  const [scaleButton, setScaleButton] = useState<any>(null);
  const [init, setInit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSpinnerExiting, setIsSpinnerExiting] = useState(false);
  const [isTextExiting, setIsTextExiting] = useState(false);
  const randomID = getRandomObjectId();
  const tlDuration = 300;
  const particlesDuration = 800;
  const particlesDelay = 50;
  const particleCount = 12;
  const totalParticlesTime = particlesDuration + (particlesDelay * particleCount) + 2500;

  useEffect(() => {
    // First burst (triangles)
    setTriangleBurst(
      new mojs.Burst({
        parent: `.vote-button-container-${randomID}`,
        radius: { 50: 110 },
        count: 8,
        angle: 45,
        children: {
          shape: "polygon",
          radius: { 8: 0 },
          scale: 1,
          stroke: "rgba(46, 204, 113, 1)",
          strokeWidth: 2,
          angle: 210,
          delay: 30,
          speed: 0.2,
          easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
          duration: particlesDuration,
          isShowEnd: false,
        },
      })
    );

    // Second burst (circles)
    setCircleBurst(
      new mojs.Burst({
        parent: `.vote-button-container-${randomID}`,
        radius: { 30: 90 },
        count: 10,
        angle: 0,
        children: {
          shape: "circle",
          fill: ["rgba(46, 204, 113, 1)", "rgba(39, 174, 96, 1)"],
          delay: "stagger(0, 50)",
          speed: 0.2,
          radius: { 4: 0 },
          easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
          duration: particlesDuration,
          isShowEnd: false,
        },
      })
    );

    // Third burst (small particles)
    setSmallBurst(
      new mojs.Burst({
        parent: `.vote-button-container-${randomID}`,
        radius: { 20: 70 },
        count: particleCount,
        angle: 90,
        children: {
          shape: "circle",
          fill: ["rgba(39, 174, 96, 1)", "rgba(46, 204, 113, 1)"],
          delay: `stagger(0, ${particlesDelay})`,
          speed: 0.3,
          radius: { 3: 0 },
          easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
          duration: particlesDuration,
          isShowEnd: false,
        },
      })
    );

    // Button scale animation
    setScaleButton(
      new mojs.Html({
        el: `#vote-button-${randomID}`,
        duration: tlDuration,
        scale: { 1.3: 1 },
        easing: mojs.easing.out,
      })
    );

    const button = document.getElementById(`vote-button-${randomID}`);
    if (button) {
      button.style.transform = "scale(1, 1)";
    }
    setInit(true);
  }, []);

  useEffect(() => {
    if (!init) return;
    const tempAnimationTimeline = new mojs.Timeline();
    tempAnimationTimeline.add([circleBurst, triangleBurst, smallBurst]);
    setAnimationTimeline(tempAnimationTimeline);
  }, [init]);

  const handleClick = async () => {
    if (loading || isSpinnerExiting || isTextExiting) return;
    
    setIsTextExiting(true);
    setLoading(true);

    // Wait for text exit animation
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsTextExiting(false);

    // Simulate some async operation
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Spinner exit animation
    setIsSpinnerExiting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoading(false);
    setIsSpinnerExiting(false);
    setShowSuccess(true);
    
    // After loading, play all the fancy animations
    if (animationTimeline) {
      animationTimeline.replay();
    }

    // Wait for ALL particles to complete their animations
    await new Promise(resolve => setTimeout(resolve, totalParticlesTime));

    // Reset back to Vote!
    setIsTextExiting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setShowSuccess(false);
    setIsTextExiting(false);
  };

  const getButtonContent = () => {
    return (
      <div className={styles.buttonContent}>
        {(!loading || isTextExiting) && (
          <span 
            className={`${styles.buttonText} ${isTextExiting ? styles.exit : styles.enter}`}
          >
            {showSuccess ? "Voted!" : "Vote!"}
          </span>
        )}
        {loading && (
          <div className={`${styles.spinner} ${isSpinnerExiting ? styles.exit : ""}`} />
        )}
      </div>
    );
  };

  return (
    <div className="tailwind-scope">
      <div className={`vote-button-container-${randomID} tw-relative`}>
        <button
          id={`vote-button-${randomID}`}
          onClick={handleClick}
          disabled={loading}
          type="button"
          className={`${styles.voteButton} tw-border-none tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-relative tw-z-10 tw-outline-1 tw-outline-transparent tw-bg-current tw-transition tw-duration-300 tw-ease-out`}
        >
          {getButtonContent()}
        </button>
      </div>
    </div>
  );
}
