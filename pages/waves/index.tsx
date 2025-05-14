import Waves from "../../components/waves/Waves";
import { AuthContext } from "../../components/auth/Auth";
import { useContext, useEffect } from "react";

export default function WavesPage() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Waves | Brain",
    });
  }, []);

  return (
    <div className="tailwind-scope lg:tw-min-h-screen tw-bg-iron-950 tw-overflow-x-hidden">
      <div className="tw-overflow-hidden tw-h-full tw-w-full">
        <Waves />
      </div>
    </div>
  );
}

WavesPage.metadata = {
  title: "Waves",
  description: "Brain",
};
