import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import { UserPageProps } from "../../../pages/[user]";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../header/HeaderPlaceholder";
import { numberWithCommas } from "../../../helpers/Helpers";
import styles from "../../../styles/Home.module.scss";
import UserPageHeader from "../user-page-header/UserPageHeader";
import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../../entities/ITDH";


const Header = dynamic(() => import("../../header/Header"), {
	ssr: false,
	loading: () => <HeaderPlaceholder />,
});

const DEFAULT_IMAGE =
	"https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_2.png";


enum Tab {
	COLLECTED = "COLLECTED",
	STATS = "STATS",
	IDENTITY = "IDENTITY",
}

const TabRoutes: Record<Tab, string> = {
	[Tab.COLLECTED]: "collected",
	[Tab.STATS]: "",
	[Tab.IDENTITY]: "identity",
};

interface UserPageLayoutProps {
	profile: IProfileAndConsolidations;
	title: string;
	consolidatedTDH: ConsolidatedTDHMetrics | null;
}

export default function UserPageLayout({ props, children }: { props: UserPageLayoutProps, children: ReactNode }) {
	const router = useRouter();
	const user = router.query.user as string;
	const pagenameFull = `${props.title} | 6529 SEIZE`;

	const descriptionArray = [];
	if (
		props.profile.consolidation.tdh &&
		props.profile.consolidation.tdh > 0
	) {
		descriptionArray.push(
			`TDH: ${numberWithCommas(props.profile.consolidation.tdh)}`
		);
	}
	if (
		props.consolidatedTDH?.balance &&
		props.consolidatedTDH?.balance > 0
	) {
		descriptionArray.push(
			`Cards: ${numberWithCommas(props.consolidatedTDH?.balance)}`
		);
	}
	descriptionArray.push("6529 SEIZE");

	const mainAddress = props.profile.profile?.primary_wallet ?? user.toLowerCase();

	const getAddressFromQuery = (): string | null => {
		if (!router.query.address) {
			return null;
		}
		if (typeof router.query.address === "string") {
			return router.query.address.toLowerCase();
		}

		if (router.query.address.length > 0) {
			return router.query.address[0].toLowerCase();
		}
		return null;
	};

	const [activeAddress, setActiveAddress] = useState<string | null>(
		getAddressFromQuery()
	);

	const onActiveAddress = (address: string) => {
		if (address === activeAddress) {
			setActiveAddress(null);
			const currentQuery = { ...router.query };
			delete currentQuery.address;
			router.push(
				{
					pathname: router.pathname,
					query: currentQuery,
				},
				undefined,
				{ shallow: true }
			);
			return;
		}
		setActiveAddress(address);
		const currentQuery = { ...router.query };
		currentQuery.address = address;
		router.push(
			{
				pathname: router.pathname,
				query: currentQuery,
			},
			undefined,
			{ shallow: true }
		);
	};

	const pathnameToTab = (pathname: string): Tab => {
		const regex = /\/\[user\]\/([^/?]+)/;
		const match = pathname.match(regex);
		const name = match ? match[1] : '';
		if (name === "") {
			return Tab.STATS;
		}
		else if (name === "collected") {
			return Tab.COLLECTED;
		}

		else if (name === "identity") {
			return Tab.IDENTITY;
		}

		return Tab.STATS;
	}

	const [tab, setTab] = useState<Tab>(pathnameToTab(router.pathname));

	useEffect(() => {
		setTab(pathnameToTab(router.pathname));
	}, [router.pathname])

	const goToTab = (tab: Tab) => {
		router.push(
			{
				pathname: `/${user}/${TabRoutes[tab]}`,
				query: router.query.address ? { address: router.query.address } : {},
			}
		);
	}

	return (
		<>
			<Head>
				<title>{pagenameFull}</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="description" content={props.title} />
				<meta
					property="og:url"
					content={`${process.env.BASE_ENDPOINT}/${user}`}
				/>
				<meta property="og:title" content={props.title} />
				<meta
					property="og:image"
					content={props.profile.profile?.pfp_url ?? DEFAULT_IMAGE}
				/>
				<meta
					property="og:description"
					content={descriptionArray.join(" | ")}
				/>
			</Head>

			<main className={styles.main}>
				<Header />
				<div className="tw-bg-neutral-950 tw-min-h-screen">
					<UserPageHeader
						profile={props.profile}
						mainAddress={mainAddress}
						consolidatedTDH={props.consolidatedTDH}
						activeAddress={activeAddress}
						onActiveAddress={onActiveAddress}
						user={user}
					/>
					<div className="tw-inline-flex tw-w-full tw-space-x-4">
						<button onClick={() => goToTab(Tab.STATS)} className={tab === Tab.STATS ? 'tw-bg-blue-500' : ''}>index</button>
						<button onClick={() => goToTab(Tab.COLLECTED)} className={tab === Tab.COLLECTED ? 'tw-bg-blue-500' : ''}>collected</button>
					</div>
					{children}
				</div>
			</main>
		</>
	)
}

