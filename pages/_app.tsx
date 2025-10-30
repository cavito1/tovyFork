import "@/styles/globals.scss";
import type { AppProps } from "next/app";
import { loginState } from "@/state";
import { RecoilRoot } from "recoil";
import { pageWithLayout } from "@/layoutTypes";
import RecoilNexus, { setRecoil } from "recoil-nexus";
import { useEffect, useState } from "react";
import Router from "next/router";
import Head from "next/head";
import axios from "axios";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	PointElement,
	LineElement,
} from "chart.js";

// Chart.js setup
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	PointElement,
	LineElement
);

type AppPropsWithLayout = AppProps & {
	Component: pageWithLayout;
};

// Reusable loading spinner
function LoadingSpinner() {
	return (
		<div className="flex h-screen items-center justify-center">
			<svg
				aria-hidden="true"
				className="w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
				viewBox="0 0 100 101"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M100 50.59C100 78.2 77.61 100.59 50 100.59S0 78.2 0 50.59 22.38.59 50 .59 100 22.98 100 50.59Z"
					fill="currentColor"
				/>
				<path
					d="M93.96 39.04a4 4 0 0 0 3.04-5.49A49.94 49.94 0 0 0 56.77 1.05a4 4 0 1 0-1.32 7.95 42 42 0 0 1 38.5 30.05Z"
					fill="currentFill"
				/>
			</svg>
		</div>
	);
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
	const [loading, setLoading] = useState(true);
	const Layout = Component.layout || (({ children }) => <>{children}</>);

	useEffect(() => {
		let called = false;

		const checkLogin = async () => {
			if (called) return;
			called = true;

			// Try loading cached login first
			const cached = sessionStorage.getItem("orbit:user");
			if (cached) {
				setRecoil(loginState, JSON.parse(cached));
				setLoading(false);
				return;
			}

			try {
				const req = await axios.get("/api/@me");
				if (req.data?.user) {
					setRecoil(loginState, {
						...req.data.user,
						workspaces: req.data.workspaces,
					});
					sessionStorage.setItem("orbit:user", JSON.stringify(req.data.user));
				}
			} catch (err: any) {
				const error = err.response?.data?.error;
				if (error === "Workspace not setup") {
					Router.replace("/welcome");
				} else if (error === "Not logged in") {
					Router.replace("/login");
				}
			} finally {
				setLoading(false);
			}
		};

		checkLogin();
	}, []);

	return (
		<RecoilRoot>
			<Head>
				<title>Bloxion</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>

			<RecoilNexus />

			{loading ? (
				<LoadingSpinner />
			) : (
				<Layout>
					<Component {...pageProps} />
				</Layout>
			)}
		</RecoilRoot>
	);
}

export default MyApp;
