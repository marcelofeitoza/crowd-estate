# Crowd-Estate

Crowd-Estate is a blockchain-based crowdfunding platform for real estate projects, built on Solana using Anchor. The platform allows users to invest in fractional property ownership, track their investments, and participate in governance through proposals and voting.

## Features

-   **Fractional Property Ownership**: Tokenized real estate properties, allowing users to invest in fractions of a property.
-   **Property Investment**: Users can invest in properties using USDC and receive tokens representing their ownership.
-   **Dividend Distribution**: Investors can claim dividends based on their property ownership.
-   **Governance**: Investors can create and vote on proposals, such as minting additional tokens or changing the property administrator.
-   **Secure Withdrawals**: Investors can withdraw their investments, returning their tokens and receiving USDC.
-   **Property Closure**: Administrators can close properties after all tokens are burned or withdrawn.

## Technologies Used

-   **Blockchain**: Solana, Anchor
-   **Backend**: Node.js, TypeScript, Express.js (recommended)
-   **Database**: Supabase
-   **Frontend**: Next.js, React, Tailwind CSS
-   **Cache**: Redis
-   **Others**: Axios, React Context, Solana Wallet Adapter

## Checklist: Crowd-Estate - Real Estate RWA Crowdfunding Platform

### **Essentials**

#### **Blockchain (Solana & Anchor)**

-   [x] Implement smart contracts for:
    -   [x] Tokenization of real estate properties
    -   [x] Handling and tracking investments
-   [x] Implement efficient state management using Solana's account model
-   [x] Use Program Derived Addresses (PDAs) appropriately for account management

#### **Backend (Node.js & TypeScript)**

-   [x] Develop API endpoints for:
    -   [x] User management (registration, login, profile updates)
    -   [x] Property CRUD operations (create, read, update, delete properties)
    -   [ ] Investment tracking and management
-   [x] Implement robust error handling and logging
-   [x] Ensure proper data validation and sanitization
-   [x] Integrate API with Solana blockchain for transaction processing

#### **Database (Supabase)**

-   [x] Design an efficient schema for storing:
    -   [x] User profiles
    -   [x] Property details (e.g., property name, price, tokens available)
    -   [ ] Investment records (tracking user investments)

#### **Frontend (Next.js + Tailwind CSS)**

-   [x] Create a responsive and intuitive user interface
-   [x] Implement the following pages/components:
    -   [x] **Home Page** with featured properties
    -   [x] **Property Listing Page** displaying all properties
    -   [x] **Property Detail Page** with investment options
    -   [x] **User Dashboard** to track investments and returns
-   [x] Implement proper state management using React Context

---

### **Bonus Features**

#### **Blockchain**

-   [x] Implement smart contracts for:
    -   [x] Dividend distribution
    -   [x] Governance and voting system
-   [x] Ensure proper access control and security measures in smart contracts

#### **Backend**

-   [ ] Develop API endpoints for:
    -   [ ] Creation and voting of governance proposals
-   [ ] Implement caching mechanisms to improve performance

#### **Database**

-   [ ] Design schema for storing governance proposals and votes
-   [ ] Implement proper indexing to optimize query performance
-   [ ] Utilize Supabase's real-time features for live updates where appropriate

#### **Frontend**

-   [ ] Implement additional pages/components:
    -   [ ] Property listing page with search and filter functionality
    -   [ ] Governance page for viewing and voting on proposals
    -   [ ] Admin panel for property and user management

---

### **Additional Features**

-   [ ] Implement a secondary market for trading property tokens
-   [ ] Add real-time notifications for investment updates and governance activities
-   [ ] Integrate with external APIs for property valuation data
-   [ ] Implement multi-language support for a global audience
-   [ ] Add comprehensive analytics and reporting features

---

### **Evaluation Criteria**

#### **Blockchain Implementation**

-   [x] Correct implementation of smart contracts using Solana and Anchor
-   [x] Efficient use of Solana's features, including PDAs and account management
-   [x] Security considerations and access control in smart contract development

---

### **License**

This project is licensed under the MIT License.

## Installation

### **Prerequisites**

-   [Node.js](https://nodejs.org/) (version 14 or higher)
-   [yarn](https://yarnpkg.com/)
-   [Rust](https://www.rust-lang.org/)
-   [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
-   [Anchor](https://www.anchor-lang.com/docs/installation)

### **Clone the Repository**

```bash
git clone https://github.com/marcelofeitoza/crowd-estate.git
cd crowd-estate
```

### **Install Dependencies**

#### **Backend**

```bash
cd app/server
yarn install
```

#### **Frontend**

```bash
cd app/client
yarn install
```

### **Build the Program**

```bash
anchor build
```

### **Test the Program**

```bash
anchor test
```

### **Deploy the Program**

To deploy the program to a Solana cluster (e.g., Devnet), run:

```bash
solana config set --url devnet
anchor deploy
```

### **Start the Backend Server**

```bash
cd app/server
yarn start
```

### **Start the Frontend Server**

```bash
cd app/client
yarn start
```

## Usage

1. **Register / Login:**
    - Access the registration page to create a new account or log in if you already have one.
2. **Connect Solana Wallet:**
    - Use a compatible wallet (such as Phantom) to connect to the platform.
3. **Invest in Properties:**
    - Browse available properties and invest in fractions using USDC.
4. **Manage Investments:**
    - Access the user dashboard to track your investments, claim dividends, and participate in governance.
5. **Participate in Governance:**
    - Create and vote on proposals to influence platform decisions.

## Tests

To run the project's tests, navigate to the backend directory and execute:

```bash
anchor test
```
