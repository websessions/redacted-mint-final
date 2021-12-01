import React from "react";
import { SigningCosmWasmClient } from "secretjs";
import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import rabbit from "./rabbit.png";
import logo from "./logo.svg";

const MintButton = styled(Button)`
  align-items: center;
  justify-content: center;
  background: #d3d3d3 !important;
`;

// TODO: this needs to be a wallet connector
const ConnectButton = styled(Button)`
  display: flex;
  height: 50px;
  align-items: center;
  justify-content: center;
`;

const CounterText = styled.span``; // add your styles here m8

const MintRoot = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: auto;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  text-align: center;
`;

const MintButtonText = styled.div`
  padding: 5px 50px;
`;

const Spacer = styled.div`
  padding: 5rem;
`;

const SmallSpacer = styled.div`
  padding: 0.75rem;
`;

// TODO: fix border-radius
const ImageContainer = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 25px;
  padding: 0.75rem;
`;

const Samples = styled.div`
  display: flex;
  flex-direction: row;
  @media only screen and (max-width: 600px) {
    flex-direction: column;
  }
`;

const Logo = styled.img`
  max-width: 400px;
  max-height: 400px;
  @media only screen and (max-width: 600px) {
    max-width: 250px;
    max-height: 250px;
  }
`;

const Text = styled.div`
  max-width: 500px;
`;

const CHAIN_ID = "supernova-2";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { keplrReady: false, account: null };
  }

  // TODO: do we want to display the user's account number and balance?
  // if so, we'll need to implement this properly. currently it doesn't work
  // because account can only be initialized after the wallet is connected (which
  // isn't necessarily after the base component mounts)
  async componentDidMount() {
    // await this.setupKeplr();

    const account = "test"; //await this.secretjs.getAccount(this.state.account.address);
    this.setState({ account });
  }

  async setupKeplr() {
    // Define sleep
    const sleep = (ms) => new Promise((accept) => setTimeout(accept, ms));

    // Wait for Keplr to be injected to the page
    while (
      !window.keplr &&
      !window.getOfflineSigner &&
      !window.getEnigmaUtils
    ) {
      await sleep(2);
    }

    // TODO: stop using experimental chain
    // Use a custom chain with Keplr.
    // On mainnet we don't need this (`experimentalSuggestChain`).
    // This works well with `enigmampc/secret-network-sw-dev`:
    //     - https://hub.docker.com/r/enigmampc/secret-network-sw-dev
    //     - Run a local chain: `docker run -it --rm -p 26657:26657 -p 26656:26656 -p 1337:1337 -v $(shell pwd):/root/code --name secretdev enigmampc/secret-network-sw-dev`
    //     - `alias secretcli='docker exec -it secretdev secretcli'`
    //     - Store a contract: `docker exec -it secretdev secretcli tx compute store /root/code/contract.wasm.gz --from a --gas 10000000 -b block -y`
    // On holodeck, set:
    //     1. CHAIN_ID = "holodeck-2"
    //     2. rpc = "ttp://chainofsecrets.secrettestnet.io:26657"
    //     3. rest = "https://chainofsecrets.secrettestnet.io"
    //     4. chainName = Whatever you like
    // For more examples, go to: https://github.com/chainapsis/keplr-example/blob/master/src/main.js
    await window.keplr.experimentalSuggestChain({
      chainId: CHAIN_ID,
      chainName: "supernova-2",
      rpc: "tcp://bootstrap.supernova.enigma.co:26657",
      rest: "http://bootstrap.supernova.enigma.co:1317/",
      bip44: {
        coinType: 529,
      },
      coinType: 529,
      stakeCurrency: {
        coinDenom: "SCRT",
        coinMinimalDenom: "uscrt",
        coinDecimals: 6,
      },
      bech32Config: {
        bech32PrefixAccAddr: "secret",
        bech32PrefixAccPub: "secretpub",
        bech32PrefixValAddr: "secretvaloper",
        bech32PrefixValPub: "secretvaloperpub",
        bech32PrefixConsAddr: "secretvalcons",
        bech32PrefixConsPub: "secretvalconspub",
      },
      currencies: [
        {
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
          coinDecimals: 6,
        },
      ],
      feeCurrencies: [
        {
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
          coinDecimals: 6,
        },
      ],
      gasPriceStep: {
        low: 0.1,
        average: 0.25,
        high: 0.4,
      },
      features: ["secretwasm"],
    });

    // Enable Keplr.
    // This pops-up a window for the user to allow keplr access to the webpage.
    await window.keplr.enable(CHAIN_ID);

    // Setup SecrtJS with Keplr's OfflineSigner
    // This pops-up a window for the user to sign on each tx we sent
    this.keplrOfflineSigner = window.getOfflineSigner(CHAIN_ID);
    const accounts = await this.keplrOfflineSigner.getAccounts();

    this.secretjs = new SigningCosmWasmClient(
      // TODO: use an env variable here
      "http://bootstrap.supernova.enigma.co:1317/", // holodeck - https://chainofsecrets.secrettestnet.io; mainnet - user your LCD/REST provider local http://localhost:1337, supernova-2 http://bootstrap.supernova.enigma.co:1317
      accounts[0].address,
      this.keplrOfflineSigner,
      window.getEnigmaUtils(CHAIN_ID),
      {
        // 300k - Max gas units we're willing to use for init
        init: {
          amount: [{ amount: "300000", denom: "uscrt" }],
          gas: "300000",
        },
        // 300k - Max gas units we're willing to use for exec
        exec: {
          amount: [{ amount: "300000", denom: "uscrt" }],
          gas: "300000",
        },
      }
    );

    this.setState({ keplrReady: true, account: accounts[0] });
  }

  async onMint() {
    try {
      // 1. Define your metadata
      const publicMetadata = "No secrets here!";
      const privateMetadata = "Ssshhhhhhh....";

      // 2. Mint a new token to yourself
      const handleMsg = {
        mint_nft: {
          owner: this.address,
          public_metadata: {
            name: publicMetadata,
          },
          private_metadata: {
            name: privateMetadata,
          },
        },
      };
      (async () => {
        await window.keplr.enable(CHAIN_ID);
        console.log("Minting yourself a nft");
        // TODO: use env variable for the contract address, like so
        // .execute(process.env.SECRET_NFT_CONTRACT, handleMsg)
        const response = await this.secretjs
          .execute("secret16pk4n6x5xy9qsfsprhc5a2r08l8kc3yeg29x6s", handleMsg) // supernova-2
          // .execute("secret1gwlhghp6a3pwc4a5nsw0ltua7mmqwdh4qy23qp", handleMsg) // holodeck-2
          .catch((err) => {
            throw new Error(`Could not execute contract: ${err}`);
          });
        console.log("response: ", response);

        if (response.code !== undefined && response.code !== 0) {
          alert("Failed to mint NFT: " + response.log || response.rawLog);
        } else {
          alert(
            "NFT successfully minted: https://explorer.secrettestnet.io/transactions/" +
              response.transactionHash
          );
        }
      })();
    } catch (error) {
      let message = error.msg || "Minting failed! Please try again!";
    }
  }

  render() {
    const isSoldOut = false;
    const isMobile = false;
    const wallet = this.state.keplrReady;
    const isMinting = false;
    const isActive = true;
    const startDate = 1635213600000;
    const mintsRemaining = 100;


    let account = <h1>Account: unknown</h1>;
    if (this.state.account) {
      account = <h1>Account: {this.state.account.address}</h1>;
    }

    let renderCounter = ({ days, hours, minutes, seconds, completed }) => {
      return (
        <CounterText>
          {days} days, {hours} hours, {minutes} minutes, {seconds} seconds
        </CounterText>
      );
    };

    return (
      <>
        <MintRoot>
          <SmallSpacer />
          {!isMobile ? (
            <Logo src={logo} alt="logo" />
          ) : (
            <Logo src={logo} alt="logo" />
          )}
          {!isSoldOut ? (
            <h1 className="font-link">Minting Live on Dec 4, 2021 5 PM UTC</h1>
          ) : (
            <h1 className="font-link">Minting is over</h1>
          )}
          <Text>
            <p className="font-link">
              1337 unique generative Redacted Rabbits.Secured by the SCRT
              network, stored on Arweave, implemented with the SNIP-721
              standard.
            </p>
          </Text>

          <MintButton
              disabled={true}
              onClick={async () => {
                await this.onMint();
              }}
              variant="contained"
            >
              {<MintButtonText className="font-link">MINT</MintButtonText>}
            </MintButton>
          <Spacer />
        </MintRoot>
      </>
    );
  }
}

export default App;
