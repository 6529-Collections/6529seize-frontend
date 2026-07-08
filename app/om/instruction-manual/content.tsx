import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const omInstructionManualMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/om/instruction-manual",
  title: "OM Instruction Manual",
  description: "Use Arrow Keys or WASD keys (if you are a gamer)",
  section: "OM",
  heroImage: {
    src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/image5.png",
    alt: "OM Instruction Manual",
    width: 100,
    height: 100,
  },
  blocks: [
    {
      type: "heading",
      content: "QUICK GUIDE TO NAVIGATING OM",
    },
    {
      type: "heading",
      content: "EXPLORE OM IN PEACE",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Enter in Single Player Mode</p>"),
    },
    {
      type: "heading",
      content: "EXPLORE OM WITH OTHERS",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Enter in Multi Player Mode</p>"),
    },
    {
      type: "heading",
      content: "MOVE AROUND",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Use Arrow Keys or WASD keys (if you are a gamer)</p>"
      ),
    },
    {
      type: "heading",
      content: "LOOK AROUND AND CHOOSE DIRECTION OF MOVEMENT",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Mouse or Trackpad</p>"),
    },
    {
      type: "heading",
      content: "JUMP",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Space bar</p>"),
    },
    {
      type: "heading",
      content: "ENTER A SPACE (ROOM)",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Walk close to an entrance until the instructions show up, then press “E”, wait for portal to load and walk through it</p>"
      ),
    },
    {
      type: "heading",
      content: "EXIT A SPACE (BACK TO THE MAIN SQUARE)",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Press “F”, wait for the portal to load and walk through it</p>"
      ),
    },
    {
      type: "heading",
      content: "SWITCH FROM FIRST / THIRD PERSON VIEW",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Press “C”</p>"),
    },
    {
      type: "heading",
      content: "CHAT (IN MULTIPLAYER MODE)",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Press “Enter” and chat</p>"),
    },
    {
      type: "heading",
      content: "CHANGE YOUR AVATAR",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Connect your wallet to OnCyber and select an NFT</p>"
      ),
    },
    {
      type: "heading",
      content: "IMPROVE YOUR GRAPHIC PERFORMANCE (LAPTOP)",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Switch your browser to use your dedicated GPU, not your integrated GPU (if you have a dedicated GPU).&nbsp; It will make a big difference in performance, though will use more battery power if you are unplugged.</p>"
      ),
    },
    {
      type: "heading",
      content: "DETAILED INSTRUCTIONS ON SWITCHING TO YOUR DEDICATED GPU",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Some computers aren't set up to use dedicated GPU.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>You may be able to adjust your GPU usage for a better experience on oncyber:</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Below are changes for those who use NVIDA GPUs and those who use AMD GPUs.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>M<strong>ake the changes to use your dedicated GPU:</strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>A) For Nvidia GPU</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>1. Open the “Nvidia Control Panel” — right click on empty space on desktop and choose “Nvidia Control Panel” from menu</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>2. Navigate to 3D Settings &gt; Manage 3D Settings</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>3. Open the tab “Program Settings” and choose your browser from the dropdown menu</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>4. Select your browser from the programs</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>5. Scroll down, select GPUs and adjust from global setting to use NVIDIA</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>B) For AMD GPU</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<ol><li>Open “Radeon Settings” — right click on empty space on desktop and choose “Radeon Settings” from menu</li><li>Navigate to Preference&gt;Additional Settings&gt; Power&gt;Switchable Graphics Application Settings</li><li>Select the browser from the list of applications. If not on the list, Add Application and select the .exe-file from the browser director.</li><li>In the column Graphics Settings, assign the “High Performance” profile to the browser</li><li>Apply changes</li></ol>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Regardless of your GPU brand, in the latest version of Windows 10 you can set per-app GPU preferences under&nbsp;<strong>Display Settings</strong>&nbsp;&gt;&nbsp;<strong>Graphics Settings</strong>. You can open Display Settings by right-clicking on the Desktop.</p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
