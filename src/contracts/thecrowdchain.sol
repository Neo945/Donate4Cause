// Pragma defines the compiler version used for currnet solidity file
pragma solidity ^0.5.8;

// Importing OpenZeppelin's SafeMath Implementation
import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";

//import "@openzeppelin/contracts/math/SafeMath.sol"; -> in remix

contract Cause {
    using SafeMath for uint256;

    //charity cause current status
    enum State {
        pending,
        completed
    }

    address payable public creator;
    uint public goal;
    uint256 public current;
    string public title;
    string public cause_type;
    string public description;

    State public state = State.pending;
    mapping(address => uint) public donors;

    //event when ever funding or donation is received
    event donationReceived(address donor, uint amount, uint current);

    //event when donation is completed and amount is dispatched
    event donationSentToTarget(address recipient);

    //check the current state via modifier
    modifier checkState(State state_) {
        require(state == state_);
        _;
    }

    //check if caller is creator
    modifier isCreator() {
        require(msg.sender == creator);
        _;
    }

    constructor(
        address payable c_starter,
        string memory c_title,
        string memory c_type,
        string memory c_description,
        uint c_goal
    ) public {
        creator = c_starter;
        title = c_title;
        cause_type = c_type;
        description = c_description;
        goal = c_goal;
        current = 0;
    }

    /* Function to contribute/donate to cause*/
    function donate() external payable checkState(State.pending) {
        require(msg.sender != creator);
        donors[msg.sender] = donors[msg.sender].add(msg.value);
        current = current.add(msg.value);
        //emit donationReceived event
        emit donationReceived(msg.sender, msg.value, current);
        //check if donation is completed
        checkIfDonationCompleted();
    }

    function checkIfDonationCompleted() public {
        if (current >= goal) {
            state = State.completed;
            payToTarget();
        }
    }

    function payToTarget() internal checkState(State.completed) returns (bool) {
        uint256 raised = current;
        current = 0;

        if (creator.send(raised)) {
            emit donationSentToTarget(creator);
            return true;
        } else {
            current = raised;
            state = State.pending;
        }
        return false;
    }

    function get()
        public
        view
        returns (
            address payable c_starter,
            string memory c_title,
            string memory c_type,
            string memory c_description,
            State currentState,
            uint256 c_goal,
            uint256 c_raised
        )
    {
        c_starter = creator;
        c_title = title;
        c_type = cause_type;
        currentState = state;
        c_description = description;
        c_goal = goal;
        c_raised = current;
    }
}

// Contract class
contract TheCrowdChain {
    // Wrappers over Solidity's arithmetic operations with added overflow checks
    using SafeMath for uint256;
    /**
     * 
     * @dev external − External functions are meant to be called by other contracts. 
     * They cannot be used for internal call. To call external function within contract this.function_name() call is required. 
     * State variables cannot be marked as external.

            public − Public functions/ Variables can be used both externally and internally. 
            For public state variable, Solidity automatically creates a getter function.

            internal − Internal functions/ Variables can only be used internally or by derived contracts.

            private − Private functions/ Variables can only be used internally and not even by derived contracts.


     */
    Cause[] private causes;

    /**
     * An event is an inheritable member of the contract, which stores the arguments passed in the transaction logs when emitted.
     *  Generally, events are used to inform the calling application about the current state of the contract, with the help of the
     *  logging facility of EVM. Events notify the applications about the change made to the contracts and applications which can
     * be used to execute the dependent logic.
     */
    event CauseCreated(
        address causeAddress,
        address creator,
        string title,
        string cause_type,
        string desciption,
        uint256 goal
    );

    /* Function to create a new cause */
    function startCause(
        string calldata title,
        string calldata cause_type,
        string calldata description,
        uint goal
    ) external {
        //creating an object for cause contract
        Cause newCauses = new Cause(
            msg.sender,
            title,
            cause_type,
            description,
            goal
        );

        //push in causes array created earlier
        causes.push(newCauses);

        //emit CauseCreated event
        emit CauseCreated(
            address(newCauses),
            msg.sender,
            title,
            cause_type,
            description,
            goal
        );
    }

    /* Function to list all the causes */
    // View - It will not modifiy the state of the contract
    /**
     * Memory is not permanent. Variables are placed in memory and used only during the execution of a function.
     * At the end of the execution of the function, everything that was placed in the memory is erased.
     *
     * Calldata is where arguments passed to functions are temporarily stored. It is not a place where we can create variables,
     * because it is unique to function arguments. It is also not possible to change the values of calldata: it is read-only.
     *
     * Storage is where state variables are stored. Remember that we declare state variables in contracts, and they are permanent.
     * Any changes we make to state variables during a transaction are stored after the transaction ends.
     * We can think of storage as a database (and indeed it is implemented by a database).
     * Storage works like a key/value dictionary, where both the key and the value are 32 bytes long.
     *
     * https://jpmorais.medium.com/learn-solidity-lesson-13-storage-memory-calldata-and-the-stack-56342b6e5ed0
     */
    function getAllCauses() external view returns (Cause[] memory) {
        return causes;
    }
}
