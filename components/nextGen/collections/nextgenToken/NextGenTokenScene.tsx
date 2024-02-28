import { useRef, useEffect, useState } from "react";
import { NextGenToken } from "../../../../entities/INextgen";
import { NextGenTokenImageMode } from "../../nextgen_helpers";

export interface NextGenTokenScene {
  mode: NextGenTokenImageMode;
  scene: string;
  behind_scene?: boolean;
  width: number;
  x: number;
  y: number;
}

export const NEXTGEN_TOKEN_SCENES: NextGenTokenScene[] = [
  {
    mode: NextGenTokenImageMode.BOHO_CHICK_LIVINGROOM,
    scene: "/nextgen/settings/boho-chic-livingroom.png",
    behind_scene: true,
    width: 0.35,
    x: 0.338,
    y: 0.201,
  },
  {
    mode: NextGenTokenImageMode.MODERN_BLACK_LIVINGROOM,
    scene: "/nextgen/settings/modern-black-livingroom.png",
    behind_scene: true,
    width: 0.201,
    x: 0.3895,
    y: 0.323,
  },
  {
    mode: NextGenTokenImageMode.PEBBLE_MUSEUM,
    scene: "/nextgen/settings/pebble-museum.jpeg",
    width: 0.2377,
    x: 0.4163,
    y: 0.176,
  },
  {
    mode: NextGenTokenImageMode.GRAND_LOBBY,
    scene: "/nextgen/settings/grand-lobby.jpeg",
    width: 0.2004,
    x: 0.4065,
    y: 0.211,
  },
  {
    mode: NextGenTokenImageMode.NYC_LOFT,
    scene: "/nextgen/settings/nyc-loft.jpeg",
    width: 0.1345,
    x: 0.589,
    y: 0.295,
  },
  {
    mode: NextGenTokenImageMode.URBAN_ALLEY,
    scene: "/nextgen/settings/ghetto-alley.jpeg",
    width: 0.2621,
    x: 0.379,
    y: 0.11,
  },
];

export function getNextGenTokenScene(mode: NextGenTokenImageMode) {
  return NEXTGEN_TOKEN_SCENES.find(
    (scene) => scene.mode.toLowerCase() === mode.toLowerCase()
  );
}

export function NextGenTokenArtImageCanvas(
  props: Readonly<{
    token: NextGenToken;
    scene: NextGenTokenScene;
    is_fullscreen: boolean;
    setCanvasUrl(url: string): void;
  }>
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const imageSrc = props.token.image_url;
  const sceneImageSrc = props.scene.scene;
  const drawBehind = props.scene.behind_scene;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const sceneImage = new Image();
      sceneImage.src = sceneImageSrc;

      const tokenImage = new Image();
      tokenImage.crossOrigin = "anonymous";
      tokenImage.src = imageSrc;

      const drawImages = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        canvas.width = sceneImage.width;
        canvas.height = sceneImage.height;

        if (drawBehind) {
          drawTokenImage();
          context.drawImage(sceneImage, 0, 0); // Then draw sceneImage
        } else {
          context.drawImage(sceneImage, 0, 0); // Draw sceneImage first
          drawTokenImage();
        }
        const canvasUrl = canvas.toDataURL("image/jpeg");
        props.setCanvasUrl(canvasUrl);
      };

      const drawTokenImage = () => {
        const imageWidth = canvas.width * props.scene.width;
        const aspectRatio = tokenImage.width / tokenImage.height;
        const imageHeight = imageWidth / aspectRatio;

        const xPosition = canvas.width * props.scene.x;
        const yPosition = canvas.height * props.scene.y;

        context.drawImage(
          tokenImage,
          xPosition,
          yPosition,
          imageWidth,
          imageHeight
        );
      };

      Promise.all([sceneImage.decode(), tokenImage.decode()]).then(drawImages);

      sceneImage.onload = drawImages;
      tokenImage.onload = drawImages;
    }
  }, [
    imageSrc,
    sceneImageSrc,
    drawBehind,
    props.scene.width,
    props.scene.x,
    props.scene.y,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: "100%",
        maxHeight: props.is_fullscreen ? "100vh" : "85vh",
      }}
    />
  );
}
