# Crowd-Estate

Crowd-Estate is a blockchain-based crowdfunding platform for real estate projects, built on Solana using Anchor. The platform allows users to invest in fractional property ownership, track their investments, and participate in governance through proposals and voting.

## Features

-   **Fractional Property Ownership**: Tokenized real estate properties, allowing users to invest in fractions of a property.
-   **Property Investment**: Users can invest in properties using USDC and receive tokens representing their ownership.
-   **Dividends Distribution**: Investors can claim dividends based on their property ownership.
-   **Governance**: Investors can create and vote on proposals, such as minting additional tokens or changing the property admin.
-   **Secure Withdrawals**: Investors can withdraw their investments, returning their tokens and receiving USDC.
-   **Property Closure**: Admins can close properties after all tokens are burned or withdrawn.

## Checklist: Crowd-Estate - Real Estate RWA Crowdfunding Platform

### Essential Features

#### **Blockchain (Solana & Anchor)**

-   [x] Implement smart contracts for:
    -   [x] Real estate property tokenization
    -   [x] Investment handling and tracking
-   [x] Implement efficient state management using Solana's account model
-   [x] Use Program Derived Addresses (PDAs) appropriately for account management

#### **Backend (Python FastAPI)**

-   [ ] Develop API endpoints for:
    -   [ ] User management (registration, login, profile updates)
    -   [ ] Property CRUD operations (create, read, update, delete properties)
    -   [ ] Investment tracking and management
-   [ ] Implement robust error handling and logging
-   [ ] Ensure proper data validation and sanitization
-   [ ] Integrate API with Solana blockchain for transaction processing

#### **Database (Supabase)**

-   [ ] Design an efficient schema for storing:
    -   [ ] User profiles
    -   [ ] Property details (e.g., property name, price, tokens available)
    -   [ ] Investment records (tracking user investments)

#### **Frontend (Next.js + Tailwind CSS)**

-   [ ] Create a responsive and intuitive user interface
-   [ ] Implement the following pages/components:
    -   [ ] **Home Page** with featured properties
    -   [ ] **Property Listing Page** displaying all properties
    -   [ ] **Property Detail Page** with investment options
    -   [ ] **User Dashboard** to track investments and returns
-   [ ] Implement proper state management using React Context or Redux

---

### Bonus Features

#### **Blockchain**

-   [x] Implement smart contracts for:
    -   [x] Dividend distribution
    -   [x] Governance and voting system
-   [x] Ensure proper access control and security measures in smart contracts

<!-- #### **Backend**

-   [ ] Develop API endpoints for:
    -   [ ] Governance proposal creation and voting
-   [ ] Implement caching mechanisms for improved performance -->

<!-- #### **Database**

-   [ ] Design schema for storing governance proposals and votes
-   [ ] Implement proper indexing for optimized query performance
-   [ ] Utilize Supabase's real-time features for live updates where appropriate -->

<!-- #### **Frontend**

-   [ ] Implement additional pages/components:
    -   [ ] Property listing page with search and filter functionality
    -   [ ] Governance page for viewing and voting on proposals
    -   [ ] Admin panel for property and user management -->

---

### Additional Features

-   [ ] Implement a secondary market for trading property tokens
<!-- -   [ ] Add real-time notifications for investment updates and governance activities
-   [ ] Integrate with external APIs for property valuation data
-   [ ] Implement multi-language support for a global audience
-   [ ] Add comprehensive analytics and reporting features -->

---

### Evaluation Criteria

<!-- #### **Code Quality and Organization**

-   [ ] Clean, well-documented, and maintainable code
-   [ ] Proper use of design patterns and best practices
-   [ ] Effective error handling and logging -->

#### **Blockchain Implementation**

-   [x] Correct implementation of smart contracts using Solana and Anchor
-   [x] Efficient use of Solana's features, including PDAs and account management
-   [x] Security considerations and access control in smart contract development

<!-- #### **Backend Architecture**

-   [ ] RESTful API design with efficient database queries
-   [ ] Proper integration with blockchain and frontend
-   [ ] Secure and scalable architecture

#### **Frontend Implementation**

-   [ ] Functional and responsive user interface
-   [ ] Seamless interaction with backend and blockchain services

#### **Documentation and Deployment**

-   [x] Clear README with setup instructions
-   [ ] API documentation and deployment instructions (or live demo) -->

<!-- ---

### Bonus Criteria

#### **Frontend Presentation and User Experience**

-   [ ] Intuitive and responsive user interface with clean design
-   [ ] Smooth animations and transitions for improved user experience

#### **Performance and Scalability**

-   [ ] Efficient data loading and state management
-   [ ] Use of caching mechanisms to improve performance

#### **Security Measures**

-   [ ] Secure user authentication and authorization
-   [ ] Data encryption and protection against vulnerabilities

#### **Innovation and Creativity**

-   [ ] Unique features or approaches to problem-solving
-   [ ] Thoughtful UX/UI decisions -->

---

## Installation

### Prerequisites

-   [Rust](https://www.rust-lang.org/)
-   [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
-   [Anchor](https://www.anchor-lang.com/docs/installation)

### Clone the Repository

```bash
git clone https://github.com/marcelofeitoza/crowd-estate.git
cd crowd-estate
```

### Build the Program

```bash
anchor build
```

### Test the Program

```bash
anchor test
```

### Deploy the Program

To deploy the program to a Solana cluster (e.g., Devnet), run:

```bash
solana config set --url devnet
anchor deploy
```


## License

This project is licensed under the MIT License.
