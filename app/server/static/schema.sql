CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    public_key VARCHAR(66) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (
        role IN ('investor', 'landlord')
    ),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    property_pda VARCHAR(66) UNIQUE NOT NULL,
    creator_public_key VARCHAR(66) NOT NULL,
    property_name VARCHAR(255),
    total_tokens BIGINT,
    available_tokens BIGINT,
    token_price_usdc NUMERIC(18, 6),
    token_symbol VARCHAR(10),
    admin VARCHAR(66),
    mint VARCHAR(66),
    bump INTEGER,
    dividends_total NUMERIC(18, 6),
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (creator_public_key) REFERENCES users (public_key)
);

CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    investment_pda VARCHAR(66) UNIQUE NOT NULL,
    investor_public_key VARCHAR(66) NOT NULL,
    property_pda VARCHAR(66) NOT NULL,
    amount BIGINT,
    dividends_claimed BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (investor_public_key) REFERENCES users (public_key),
    FOREIGN KEY (property_pda) REFERENCES properties (property_pda)
);

CREATE TABLE governance_proposals (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(66) UNIQUE NOT NULL,
    property_pda VARCHAR(66) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_public_key VARCHAR(66) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (
        status IN (
            'pending',
            'active',
            'executed',
            'rejected'
        )
    ),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (property_pda) REFERENCES properties (property_pda),
    FOREIGN KEY (creator_public_key) REFERENCES users (public_key)
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(66) NOT NULL,
    voter_public_key VARCHAR(66) NOT NULL,
    vote BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (proposal_id) REFERENCES governance_proposals (proposal_id),
    FOREIGN KEY (voter_public_key) REFERENCES users (public_key),
    UNIQUE (proposal_id, voter_public_key)
);