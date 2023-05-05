import { Inter } from "next/font/google";
import { Web3Button } from "@web3modal/react";
import { useWeb3ModalTheme } from "@web3modal/react";
import Image from "next/image";
import {
  useContractRead,
  useDisconnect,
  usePrepareContractWrite,
  useContractWrite,
} from "wagmi";
import devdeep_abi from "../abi/devdeep_abi.json";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
const inter = Inter({ subsets: ["latin"] });
// import { useNotification, notifyType } from "web3uikit";

export default function Home() {
  // TODO: slove this thing
  // contract read
  //   { winner, isError, isLoading } = useContractRead({
  //     address: "0x03562a83F7Db9838885a388fc6dB057fB47b58f3",
  //     abi: devdeep_abi,
  //     functionName: "getWinnerAddress",
  //   });
  //   const [prev_winner, setwinner] = useState("");
  //   useEffect(() => {
  //     const getAddress = async () => {
  //       setwinner(winner);
  //     };
  //     getAddress();
  //   }, [winner]);

  // contract write
  const { config } = usePrepareContractWrite({
    address: "0x03562a83F7Db9838885a388fc6dB057fB47b58f3",
    abi: devdeep_abi,
    functionName: "enter",
    args: [],
    overrides: { value: ethers.utils.parseEther("0.01") },
  });
  const { data, write: Takarakuji } = useContractWrite(config);

  // Theme setting
  const { theme, setTheme } = useWeb3ModalTheme();
  // Modal's theme object
  theme;
  // Set modal theme
  setTheme({
    themeMode: "light",
    themeVariables: {
      "--w3m-font-family": "Roboto, sans-serif",
      "--w3m-accent-color": "#1F2937",
      "--w3m-background-color": "#000000",
      // ...
    },
  });

  // get address
  const { address, isConnecting, isDisconnected } = useAccount();
  // use useEffect to get the winner address
  const [temp, setData] = useState("");
  useEffect(() => {
    const getAddress = async () => {
      setData(address ? address : "");
    };
    getAddress();
  }, [address]);

  // for notification TODO: solve this thing
  //   const dispatch = useNotification();

  //   const handleNewNotification = (
  //     type: notifyType,
  //     icon?: React.ReactElement,
  //     position?: IPosition
  //   ) => {
  //     dispatch({
  //       type,
  //       message: "Somebody messaged you",
  //       title: "New Notification",
  //       icon,
  //       position: position || "topR",
  //     });
  //   };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 dis">
      <div className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">Welcome to Our Takarakuji</h1>
        <Image
          src="/home_image.jpg"
          style={{
            border: "1px solid grey",
            marginTop: "3em",
            borderRadius: "1em",
          }}
          width={400}
          height={400}
          alt="gateway"
        />
        <p className="mt-3 text-2xl"></p>
        {/* // hydration supress warning */}
        <p className="mt-3 text-2xl">
          {" "}
          {temp
            ? `Account Address : ${temp}`
            : "Not Connected please connect first"}
        </p>
        <p className="mt-3 text-2xl"></p>
        <p className="mt-3 text-2xl"></p>
        {/* <p className="mt-3 text-2xl">
          {" "}
          {isConnecting ? "Connecting..." : "Not Connected"}
        </p>
        <p className="mt-3 text-2xl"> {isDisconnected ? "Disconnected" : ""}</p> */}
        {/* <p className="mt-3 text-2xl">
          {" "}
          {address ? address : "Please Connect to Wallet"}
        </p> */}
        <p className="mt-3 text-2xl"></p>
        <h2>
          <Web3Button />
        </h2>
        <p className="mt-3 text-2xl"></p>
        <p className="mt-3 text-2xl"></p>
        Fee : 0.01 ETH per entry (non-refundable) more tickets = more chance to
        win
        <p>
          interval : 1 min (for testing purpose) so you can enter every 1 min
        </p>
        <p className="mt-3 text-2xl"></p>
        <button
          onClick={async () => {
            await Takarakuji?.();
          }}
          style={{
            marginTop: "1em",
            fontSize: 20,
            color: "white",
            borderRadius: 16,
            backgroundColor: "teal",
            height: 75,
            width: 200,
          }}
        >
          Enter Takarakuji
        </button>
      </div>
    </div>
  );
}
