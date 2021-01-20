import { useState, useEffect } from "react";
import Web3 from "web3";
import logo from "./logo.svg";
import "./App.css";
import * as ipfsClient from "ipfs-http-client";
import Meme from "./abis/Meme.json";

function App() {
  const [bufferFile, setBufferFile] = useState(null);
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [memeHash, setMemeHash] = useState(
    "QmepHogi9WL1mx9WkuAiv35q9K4ZFMZhnwmGtgKGYzXqtb"
  );

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
    }
    if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert("Включите metamask");
    }
  };

  const loadBlackchainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
    const networkId = await web3.eth.net.getId();
    const networkData = Meme.networks[networkId];
    if (networkData) {
      const abi = Meme.abi;
      const address = networkData.address;
      const contract = new web3.eth.Contract(abi, address);
      setContract(contract)
      const memeHash = await contract.methods.get().call()
      setMemeHash(memeHash)
      console.log(contract)
    } else {
      window.alert("Смарт контракт не развернут ищем сеть");
    }
  };

  const ipfs = ipfsClient({
    host: "ipfs.infura.io",
    port: "5001",
    protocol: "http",
  });

  const captureFile = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      setBufferFile(Buffer(reader.result));
    };
  };

  const onSubmit = (event) => {
    event.preventDefault();
    ipfs.add(bufferFile).then((res,error) => {
      console.log(res.path);
      const memeHash = res.path
      if(error) {
        console.error(error)
        return
      }
      contract.methods.set(memeHash).send({from: account}).then(r => {
        setMemeHash(memeHash);
      })
    });
    console.log("submiting");

  };

  useEffect(() => {
    loadWeb3();
    loadBlackchainData();
    return () => {
      loadWeb3();
      loadBlackchainData();
    };
  }, []);

  //Example: "QmepHogi9WL1mx9WkuAiv35q9K4ZFMZhnwmGtgKGYzXqtb"

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button>Enable Metamask</button>
        <ul>
          <li>{account}</li>
        </ul>
      </header>
      <main>
        <img
          src={`https://ipfs.infura.io/ipfs/${memeHash}`}
          alt="meme"
          style={{ height: "250px", width: "250px" }}
        />
        <h2>Изменить мем</h2>
        <form onSubmit={onSubmit}>
          <input type="file" onChange={captureFile} />
          <input type="submit" />
        </form>
      </main>
    </div>
  );
}

export default App;
