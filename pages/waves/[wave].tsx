import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function WavePage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Waves", href: "/waves" },
    { display: "Wave" },
  ];

  return (
    <>
      <Head>
        <title>Waves | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Waves | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/waves`}
        />
        <meta property="og:title" content="Waves" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
        <meta property="og:description" content="6529 SEIZE" />
      </Head>
      <main className="tailwind-scope tw-min-h-screen tw-bg-iron-950 tw-overflow-x-hidden">
        <div>
          <Header />
          <Breadcrumb breadcrumbs={breadcrumbs} />
        </div>
        <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-20 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <div className="tw-flex tw-justify-center tw-gap-x-10">
            <div>
              <div className="tw-group tw-w-[372px]">
                <div className="tw-relative tw-w-full tw-h-20">
                  <img
                    className="tw-w-full tw-h-full tw-object-cover tw-rounded-t-2xl"
                    src="https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=2896&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt=""
                  />
                  <div className="tw-absolute tw-inset-0 tw-rounded-t-2xl tw-ring-2 tw-ring-white/20 tw-ring-inset tw-pointer-events-none"></div>
                </div>
                <div className="tw-bg-iron-900 tw-relative tw-border tw-border-solid tw-border-t-0 tw-border-iron-700">
                  <div className="tw-px-4 sm:tw-px-6 tw-flex tw-items-end tw-justify-between">
                    <img
                      className="-tw-mt-6 tw-h-14 tw-w-14 tw-rounded-full sm:tw-h-16 sm:tw-w-16 tw-bg-iron-700 tw-ring-2 tw-ring-iron-900"
                      src="https://images.unsplash.com/photo-1604079681864-c6fbd7eb109c?q=80&w=2731&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt=""
                    />
                  </div>
                  <div className="tw-pt-2 tw-pb-4 tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
                    <div className="tw-px-4 sm:tw-px-6 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                      <div>
                        <p className="tw-mb-0 tw-text-2xl tw-text-white tw-font-semibold">
                          Memes-Chat
                        </p>
                        <p className="tw-mt-2 tw-mb-0 tw-text-base tw-font-normal tw-text-iron-400">
                          The main chat for 6529. Open to all. Please join!
                        </p>
                        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-2">
                          <div className="tw-flex -tw-space-x-0.5">
                            <div>
                              <img
                                className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                                src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt=""
                              />
                            </div>
                            <div>
                              <img
                                className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                                src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt="Emma Dorsey"
                              />
                            </div>
                            <div>
                              <img
                                className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                                src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt="Emma Dorsey"
                              />
                            </div>
                            <div>
                              <img
                                className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                                src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt="Emma Dorsey"
                              />
                            </div>
                          </div>
                          <p className="tw-text-sm tw-font-medium tw-text-iron-400 tw-mb-0">
                            +1,235 people dropped
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="tw-pt-3 tw-px-4 sm:tw-px-6 tw-flex tw-flex-col tw-gap-y-4">
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Created by
                        </span>
                        <div className="tw-flex tw-items-center tw-gap-x-2">
                          <img
                            className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800"
                            src="#"
                            alt="Profile Picture"
                          />
                          <span className="tw-font-medium tw-text-white tw-text-base">
                            punk6529
                          </span>
                        </div>
                      </div>
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Created date
                        </span>
                        <span className="tw-font-medium tw-text-iron-50 tw-text-base">
                          2 days ago
                        </span>
                      </div>
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Ending date
                        </span>
                        <span className="tw-font-medium tw-text-iron-50 tw-text-base">
                          7 days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tw-w-[672px] tw-bg-red">drop</div>
          </div>
        </div>
      </main>
    </>
  );
}
