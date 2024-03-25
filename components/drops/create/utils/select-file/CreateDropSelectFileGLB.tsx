import { useRef } from "react";

export default function CreateDropSelectFileGLB({
  onFileChange,
}: {
  readonly onFileChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label htmlFor="create-drop-glb-input">
        <svg
          className="tw-cursor-pointer tw-h-5 tw-w-5 tw-text-iron-300"
          viewBox="0 0 32 32"
          fill="currentColor"
          aria-hidden="true"
        >
          <g id="Grid" display="none"></g>
          <g id="Card"></g>
          <g id="Love"></g>
          <g id="Dice"></g>
          <g id="Game_Controller"></g>
          <g id="Domino"></g>
          <g id="Coin"></g>
          <g id="Target"></g>
          <g id="Computer"></g>
          <g id="Game_Console"></g>
          <g id="Sword"></g>
          <g id="Bomb"></g>
          <g id="Skull"></g>
          <g id="Mouse"></g>
          <g id="Smartphone"></g>
          <g id="_x33_D">
            <path d="m15.213 5.842-7.617 4.398c-.485.28-.787.802-.787 1.362v8.796c0 .561.302 1.082.787 1.362l7.619 4.399c.242.139.513.209.785.209.271 0 .544-.07.787-.21l7.617-4.398c.485-.28.787-.802.787-1.362v-8.796c0-.56-.302-1.082-.787-1.362l-7.617-4.398c-.486-.28-1.088-.28-1.574 0zm.787 1.624 6.483 3.744-6.483 3.745-6.483-3.745zm-7.391 5.299 6.49 3.749v7.502l-6.49-3.748zm8.291 11.25v-7.502l6.49-3.749v7.503z"></path>
            <path d="m7.357 23.971-2.581-1.493v-2.978c0-.497-.403-.9-.9-.9s-.9.403-.9.9v2.978c0 .642.346 1.24.902 1.563l2.579 1.489c.142.082.297.121.449.121.312 0 .613-.162.78-.45.25-.431.102-.982-.329-1.23z"></path>
            <path d="m3.876 13.399c.497 0 .9-.403.9-.9l.002-2.981 2.579-1.489c.431-.249.579-.799.33-1.23-.249-.429-.798-.578-1.23-.329l-2.578 1.489c-.557.321-.903.919-.903 1.562v2.979c0 .497.403.899.9.899z"></path>
            <path d="m13.419 4.529 2.583-1.489 2.579 1.489c.142.082.297.121.449.121.312 0 .613-.162.78-.45.249-.431.102-.981-.329-1.229l-2.581-1.491c-.555-.319-1.244-.319-1.803.001l-2.579 1.489c-.43.249-.578.8-.329 1.23s.798.579 1.23.329z"></path>
            <path d="m28.122 7.959-2.579-1.489c-.432-.249-.98-.101-1.229.329-.249.431-.102.981.329 1.229l2.581 1.492v2.98c0 .497.403.9.9.9s.9-.403.9-.9v-2.979c0-.643-.346-1.241-.902-1.562z"></path>
            <path d="m28.124 18.6c-.497 0-.9.403-.9.9l-.002 2.981-2.579 1.489c-.431.248-.578.799-.329 1.229.167.288.469.45.78.45.152 0 .308-.039.449-.121l2.579-1.489c.557-.322.902-.921.902-1.563v-2.976c0-.497-.403-.9-.9-.9z"></path>
            <path d="m18.581 27.471-2.583 1.489-2.579-1.489c-.432-.249-.98-.1-1.229.329-.249.431-.102.981.329 1.229l2.581 1.49c.277.159.589.239.9.239s.623-.08.902-.24l2.579-1.489c.431-.248.578-.799.329-1.229-.247-.429-.798-.578-1.229-.329z"></path>
          </g>
          <g id="Medal"></g>
          <g id="VR"></g>
          <g id="Joystick"></g>
          <g id="Poker_Chip"></g>
          <g id="Crown"></g>
          <g id="Speedometer"></g>
          <g id="Mushroom"></g>
          <g id="Ufo"></g>
          <g id="Tic_Tac_Toe"></g>
          <g id="Gem"></g>
        </svg>
        <input
          id="create-drop-glb-input"
          ref={inputRef}
          type="file"
          className="tw-hidden"
          accept=".glb"
          onChange={(e: any) => {
            if (e.target.files) {
              const f = e.target.files[0];
              onFileChange(f);
            }
          }}
        />
      </label>
    </div>
  );
}
