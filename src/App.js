import React, { Component } from "react";
import { default as web3 } from "./web3";
import TheCrowdChainInstance from "./contracts/TheCrowdChainInstance";
import TheCauseInstance from "./contracts/TheCauseInstance";
import BlockUi from "react-block-ui";
import "react-block-ui/style.css";

const toEther = (number) => {
  return web3.utils.fromWei(number, "ether");
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: "0x0",
      balance: "0",
      causes: [],
      currentCause: null,
      metaMaskDisconnected: false,
      blocking: false,
    };
    this.causeData = [];
  }

  toggleBlocking = () => {
    this.setState({ blocking: !this.state.blocking });
  };

  async componentDidMount() {
    await this.checkIfMetaMaskConnected();
    this.getAllCauses();
  }

  checkIfMetaMaskConnected = async () => {
    if (!window.ethereum.selectedAddress) {
      window.ethereum.enable();
      if (web3.currentProvider.publicConfigStore)
        web3.currentProvider.publicConfigStore.on(
          "update",
          this.metaMaskcallback
        );
      else window.location.reload();
      return;
    } else {
      const account = await web3.eth.getCoinbase();
      const balance = await web3.eth.getBalance(account);
      web3.eth.defaultAccount = account;
      console.log(account);
      this.setState({ account, balance });
    }
  };

  metaMaskcallback = (data) => {
    if (data.selectedAddress && data.isEnabled && data.isUnlocked) {
      this.setState({ metaMaskDisconnected: false });
      this.getAllCauses();
    } else {
      this.setState({ metaMaskDisconnected: true });
    }
  };

  getAllCauses = () => {
    this.setState({ causes: [] });
    console.log(TheCrowdChainInstance);
    TheCrowdChainInstance.methods
      .getAllCauses()
      .call()
      .then((response) => {
        response.forEach((causeAddress) => {
          const causeInst = TheCauseInstance(causeAddress);
          //   console.log(causeAddress);
          causeInst.methods
            .get()
            .call()
            .then(async (causeData) => {
              // console.log(causeData);
              let causes = [...this.state.causes];
              causeData["contract_address"] = causeAddress;
              const donation = await causeInst.methods
                .donors(web3.eth.defaultAccount)
                .call();
              causeData["donation"] = donation;
              causes.push(causeData);
              this.setState({ causes });
              this.causeData.push(causeData);
            });
        });
      });
  };

  handleOnClickDonation = (item) => {
    this.setState({ currentCause: item });
  };

  addCause = () => {
    if (
      this.state.title &&
      this.state.type &&
      this.state.description &&
      this.state.goal
    ) {
      this.toggleBlocking();
      TheCrowdChainInstance.methods
        .startCause(
          this.state.title,
          this.state.type,
          this.state.description,
          web3.utils.toWei(this.state.goal, "ether")
        )
        .send({
          from: web3.eth.defaultAccount,
        })
        .then((response) => {
          this.getAllCauses();
          this.toggleBlocking();
          console.log(response);
        });
    } else {
      alert("Please fill all the fields to add Cause");
      return;
    }
  };

  donate = () => {
    if (this.state.currentCause) {
      let left =
        Number(toEther(this.state.currentCause.c_goal)) -
        Number(toEther(this.state.currentCause.c_raised));
      if (Number(this.state.raised) > 0 && Number(this.state.raised) <= left) {
        this.toggleBlocking();
        const causeInst = TheCauseInstance(
          this.state.currentCause["contract_address"]
        );
        causeInst.methods
          .donate()
          .send({
            from: this.state.account,
            value: web3.utils.toWei(this.state.raised, "ether"),
          })
          .then((response) => {
            this.toggleBlocking();
            console.log(response);
            this.getAllCauses();
          })
          .catch((error) => {
            this.toggleBlocking();
            alert(error.message);
            return;
          });
      } else {
        alert(
          "You can not donate this amount, the maximum amount you can donate is " +
            left
        );
        return;
      }
    }
  };

  render() {
    return (
      <React.Fragment>
        <BlockUi blocking={this.state.blocking}>
          <section className="section causes">
            <div className="container">
              <div className="row margin-bottom">
                <div className="col-lg-4">
                  <div className="heading heading--primary">
                    <span className="heading__pre-title">
                      <b>What we Do</b>
                    </span>
                    <h2 className="heading__title no-margin-bottom">
                      <span>Help</span> <span>Causes</span>
                    </h2>
                  </div>
                </div>
                <div className="col-lg-8">
                  <p className="causes__heading-text">
                    Our platform provides a safe and easy way to support causes
                    that matter to you, whether it's helping people in need,
                    protecting the environment, promoting education, or
                    advancing medical research. At our website, you can browse
                    through a wide range of organizations and charities that are
                    making a positive impact in the world. We believe that
                    donating should be convenient and hassle-free, so we've made
                    it easy to give online using a variety of payment methods.
                  </p>
                  <p>
                    You can choose to make a one-time donation or set up a
                    recurring donation to support your favorite causes on an
                    ongoing basis. We take your privacy and security seriously,
                    so we use the latest encryption technology to protect your
                    personal and financial information. You can also choose to
                    remain anonymous if you prefer. Whether you want to support
                    a local charity, a national organization, or an
                    international cause, our donation website is here to help.
                    Your donation can make a real difference in the world, so
                    please consider giving today.
                  </p>
                  <p>Thank you for your generosity!</p>
                </div>
              </div>
              <div
                className="account"
                style={{
                  width: "50%",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div
                  className="account__info"
                  style={{
                    width: "150px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Acount: {this.state.account}
                </div>
                <div className="account__info">
                  Balance: {Math.floor(toEther(this.state.balance) * 100) / 100}{" "}
                  ETH
                </div>
              </div>
              <div className={"text-center mb-2"}>
                <button
                  data-toggle={"modal"}
                  data-target={"#cretecausemodal"}
                  style={{ background: "#354463", color: "white" }}
                  className="button causes-item__button button--secondary d-none d-sm-inline-block"
                >
                  Create new Cause
                </button>
              </div>
              <div className="row">
                {this.state.causes.map((item, index) => {
                  console.log(index, item);
                  return (
                    <div key={index} className="col-lg-6">
                      <div className="causes-item causes-item--style-2">
                        <div className="causes-item__body">
                          <div className="already-donated">
                            Your Donation: {toEther(item.donation)} ETH
                          </div>
                          {item.c_starter === web3.eth.defaultAccount ||
                          item.currentState == 1 ? (
                            ""
                          ) : (
                            <div className="causes-item__action">
                              <div className="causes-item__badge">
                                {item.c_type}
                              </div>
                              <a
                                onClick={() => this.handleOnClickDonation(item)}
                                className="button causes-item__button button--primary d-none d-sm-inline-block"
                                data-toggle="modal"
                                data-target={"#donateModal"}
                                href="#"
                              >
                                + Donate{" "}
                              </a>
                            </div>
                          )}
                          <div className="causes-item__top">
                            <h6 className="causes-item__title">
                              {" "}
                              <a href="#_">{item.c_title}</a>
                            </h6>
                            <p>{item.c_description}</p>
                          </div>
                          <div className="causes-item__lower">
                            <div className="progress-bar">
                              <div
                                className="progress-bar__inner"
                                style={{
                                  width:
                                    item.currentState == 0
                                      ? Math.floor(
                                          (toEther(item.c_raised) /
                                            toEther(item.c_goal)) *
                                            100
                                        ) + "%"
                                      : "100%",
                                }}
                              >
                                <div className="progress-bar__value">
                                  {Math.floor(
                                    (toEther(item.c_raised) /
                                      toEther(item.c_goal)) *
                                      100
                                  )}
                                  %
                                </div>
                              </div>
                            </div>

                            <div className="causes-item__details-holder">
                              <div className="causes-item__details-item">
                                <span>Goal: </span>
                                <span>{toEther(item.c_goal)} ETH </span>
                              </div>
                              <div className="causes-item__details-item text-right">
                                <span>Pledged: </span>
                                <span>
                                  {item.currentState == 1
                                    ? toEther(item.c_goal)
                                    : toEther(item.c_raised)}{" "}
                                  ETH
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          <div id="cretecausemodal" className="modal fade" role="dialog">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Create new Cause</h4>
                  <button type="button" className="close" data-dismiss="modal">
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <div className={"form-group"}>
                    <label htmlFor="">Enter Cause Title</label>
                    <input
                      type="text"
                      className={"form-control"}
                      name={"title"}
                      onChange={(e) => this.setState({ title: e.target.value })}
                    />
                  </div>
                  <div className={"form-group"}>
                    <label htmlFor="">Enter Cause Type</label>
                    <input
                      type="text"
                      className={"form-control"}
                      name={"type"}
                      onChange={(e) => this.setState({ type: e.target.value })}
                    />
                  </div>
                  <div className={"form-group"}>
                    <label htmlFor="">Enter Cause Description</label>
                    <input
                      type="text"
                      className={"form-control"}
                      name={"description"}
                      onChange={(e) =>
                        this.setState({ description: e.target.value })
                      }
                    />
                  </div>
                  <div className={"form-group"}>
                    <label htmlFor="">Enter Cause Goal</label>
                    <input
                      type="number"
                      className={"form-control"}
                      name={"goal"}
                      onChange={(e) => this.setState({ goal: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer text-center">
                  <button
                    onClick={this.addCause}
                    type="button"
                    style={{ background: "#354463", color: "white" }}
                    className="button causes-item__button button--secondary d-none d-sm-inline-block"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div id="donateModal" className="modal fade" role="dialog">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Donate to a cause</h4>
                  <button type="button" className="close" data-dismiss="modal">
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <div className={"form-group"}>
                    <label htmlFor="">Enter Amount Goal</label>
                    <input
                      type="number"
                      className={"form-control"}
                      name={"goal"}
                      onChange={(e) =>
                        this.setState({ raised: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer text-center">
                  <button
                    onClick={this.donate}
                    type="button"
                    style={{ background: "#354463", color: "white" }}
                    className="button causes-item__button button--secondary d-none d-sm-inline-block"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </BlockUi>
      </React.Fragment>
    );
  }
}

export default App;
