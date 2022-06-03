const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("Lottery", function () {
  
  let Lottery;
  let LotteryContract;

  before(async () => {
    LotteryContract = await ethers.getContractFactory("Lottery");
    // @param numner 10 The number of the start block.
    Lottery = await LotteryContract.deploy(10);
    await Lottery.deployed();
    LotteryAddress = Lottery.address;
  });

  // Used to mine x amount of blocks for testing purposes.
  async function mineBlocks(blockNumber) {
    while (blockNumber > 0) {
      blockNumber--;
      await hre.network.provider.request({
        method: "evm_mine",
        params: [],
      });
    }
  }

  it("User should not be able to buy tickets before start block.", async function () {
    
    await mineBlocks(2);
    let latestBlock = await hre.ethers.provider.getBlock("latest")
    expect(latestBlock.number).to.be.equal(3);
    await expect(Lottery.buyTicket("https://off-chain-data")).to.be.revertedWith('Tickets cannot be buyght yet.');
  });


  it("User should be able to buy tickets after the start block is mined.", async function () {
    
    await mineBlocks(20);
    await Lottery.buyTicket("https://off-chain-data", { value: 2000000000000000 })
    await expect(await Lottery.getTicketsCount()).to.be.equal(1);
  });

  it("Minimum ticket price should be 0.001 ETH", async function () {
    await expect(Lottery.buyTicket("https://off-chain-data", { value: 200000000000000 })).to.be.revertedWith('Ticket Price is 0.001 ETH.');
  });

  it("Shoud track all existing tickets.", async function () {
    const [_, address2, address3, address4, address5, address6] = await ethers.getSigners();
    await Lottery.connect(address2).buyTicket("https://off-chain-data", { value: 2000000000000000 })
    
    //const provider = waffle.provider;
    //const balance0ETH = await provider.getBalance(address2.address);
    //console.log(balance0ETH)
    
    await Lottery.connect(address3).buyTicket("https://off-chain-data", { value: 2000000000000000 })
    await Lottery.connect(address3).buyTicket("https://off-chain-data", { value: 2000000000000000 })
    await Lottery.connect(address4).buyTicket("https://off-chain-data", { value: 2000000000000000 })
    await Lottery.connect(address5).buyTicket("https://off-chain-data", { value: 2000000000000000 })
    await Lottery.connect(address5).buyTicket("https://off-chain-data", { value: 2000000000000000 })
    await Lottery.connect(address6).buyTicket("https://off-chain-data", { value: 2000000000000000 })
    await expect(await Lottery.getTicketsCount()).to.be.equal(8);
  });

  it("Should be able to pick Surprice Winner after 50% of the game time is passed.", async function () {
    const [_, address2, address3, address4, address5, address6] = await ethers.getSigners();
    let balance = parseInt(await Lottery.getBalance())
    await mineBlocks(200);
    await Lottery.connect(address4).buyTicket("https://off-chain-data", { value: 2000000000000000 })
    await expect(parseInt(await Lottery.getBalance())).to.be.equal((balance + 2000000000000000) / 2);
  });

  it("Should be unable to select a winner before the end block is created.", async function () {
    await expect(Lottery.pickFinalWinner()).to.be.revertedWith('Lottery Game is still in progress.');
  });

  it("User should not be allowed to buy tickets after the end block is reached.", async function () {
    
    await mineBlocks(300);
    await expect(Lottery.buyTicket("https://off-chain-data", { value: 200000000000000 })).to.be.revertedWith('Tickets cannot be buyght anymore.');
  });

  it("Should Select winner once the game time has ended.", async function () {
    
    const provider = waffle.provider;
    const [_, address2, address3, address4, address5, address6] = await ethers.getSigners();
    const addresses = [_.address, address2.address, address3.address, address4.address, address5.address, address6.address]
    
    const [
      address1bal,
      address2bal,
      address3bal,
      address4bal,
      address5bal,
      address6bal
    ] = [
      parseInt(await provider.getBalance(_.address)),
      parseInt(await provider.getBalance(address2.address)),
      parseInt(await provider.getBalance(address3.address)),
      parseInt(await provider.getBalance(address4.address)),
      parseInt(await provider.getBalance(address5.address)),
      parseInt(await provider.getBalance(address6.address))
    ]
    
    const oldbalances = [address1bal, address2bal, address3bal, address4bal, address5bal, address6bal]

    const winnerAddress = await Lottery.pickFinalWinner();
    
    const [
      newaddress1bal,
      newaddress2bal,
      newaddress3bal,
      newaddress4bal,
      newaddress5bal,
      newaddress6bal
    ] = [
      parseInt(await provider.getBalance(_.address)),
      parseInt(await provider.getBalance(address2.address)),
      parseInt(await provider.getBalance(address3.address)),
      parseInt(await provider.getBalance(address4.address)),
      parseInt(await provider.getBalance(address5.address)),
      parseInt(await provider.getBalance(address6.address))
    ]
    
    const newbalances = [newaddress1bal, newaddress2bal, newaddress3bal, newaddress4bal, newaddress5bal, newaddress6bal]

    for (let i =0; i < newbalances.length; i++) {
      if (newbalances[i] - oldbalances[i] > 100000) {
        console.log("   Winner is: " + addresses[i] + " (user" + [i] + ")")
      }
    }
    //console.log(winnerAddress)
    /*
    const newaddress1balance = await provider.getBalance(_.address);
    const newaddress2balance = await provider.getBalance(address2.address);
    const newaddress3balance = await provider.getBalance(address3.address);
    const newaddress4balance = await provider.getBalance(address4.address);
    const newaddress5balance = await provider.getBalance(address5.address);
    const newaddress6balance = await provider.getBalance(address6.address);

    console.log(parseInt(newaddress1balance) - parseInt(address1balance));
    console.log(parseInt(newaddress2balance) - parseInt(address2balance));
    console.log(parseInt(newaddress3balance) - parseInt(address3balance));
    console.log(parseInt(newaddress4balance) - parseInt(address4balance));
    console.log(parseInt(newaddress5balance) - parseInt(address5balance));
    console.log(parseInt(newaddress6balance) - parseInt(address6balance));
    */
  });

});