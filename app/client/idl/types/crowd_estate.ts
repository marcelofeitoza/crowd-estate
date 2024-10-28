/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/crowd_estate.json`.
 */
export type CrowdEstate = {
  "address": "rwa5WajX9npiz1iHAHYQ9AwGcKAM9Ru8DkrRkfGjN9d",
  "metadata": {
    "name": "crowdEstate",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeProperty",
      "discriminator": [
        221,
        217,
        65,
        122,
        187,
        119,
        89,
        243
      ],
      "accounts": [
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "property"
          ]
        },
        {
          "name": "adminUsdcAccount",
          "writable": true
        },
        {
          "name": "propertyMint",
          "writable": true
        },
        {
          "name": "propertyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createProperty",
      "discriminator": [
        45,
        115,
        89,
        113,
        193,
        252,
        125,
        27
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "property",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "admin"
              },
              {
                "kind": "arg",
                "path": "propertyName"
              }
            ]
          }
        },
        {
          "name": "propertyMint",
          "writable": true
        },
        {
          "name": "propertyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "propertyName",
          "type": "string"
        },
        {
          "name": "totalTokens",
          "type": "u64"
        },
        {
          "name": "tokenPriceUsdc",
          "type": "u64"
        },
        {
          "name": "tokenSymbol",
          "type": "string"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createProposal",
      "discriminator": [
        132,
        116,
        68,
        174,
        216,
        160,
        198,
        22
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposer"
              },
              {
                "kind": "account",
                "path": "property"
              }
            ]
          }
        },
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "proposalType",
          "type": {
            "defined": {
              "name": "proposalType"
            }
          }
        },
        {
          "name": "newAdmin",
          "type": "string"
        },
        {
          "name": "additionalTokens",
          "type": "u64"
        }
      ]
    },
    {
      "name": "distributeDividends",
      "discriminator": [
        185,
        147,
        6,
        245,
        80,
        98,
        186,
        136
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "adminUsdcAccount",
          "writable": true
        },
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "propertyUsdcAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "totalDividends",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeProposal",
      "discriminator": [
        186,
        60,
        116,
        133,
        108,
        128,
        111,
        28
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "newAdmin",
          "writable": true,
          "signer": true,
          "optional": true
        },
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "propertyMint",
          "writable": true
        },
        {
          "name": "propertyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "destinationTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "investInProperty",
      "discriminator": [
        0,
        26,
        127,
        54,
        185,
        102,
        118,
        203
      ],
      "accounts": [
        {
          "name": "investor",
          "writable": true,
          "signer": true
        },
        {
          "name": "investorUsdcAccount",
          "writable": true
        },
        {
          "name": "investmentAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  118,
                  101,
                  115,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "investor"
              },
              {
                "kind": "account",
                "path": "property"
              }
            ]
          }
        },
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "propertyMint",
          "writable": true
        },
        {
          "name": "propertyUsdcAccount",
          "writable": true
        },
        {
          "name": "propertyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "investorPropertyTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "investor"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "usdcAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mintAdditionalTokens",
      "discriminator": [
        145,
        232,
        211,
        225,
        5,
        19,
        26,
        15
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "propertyMint",
          "writable": true
        },
        {
          "name": "propertyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeemDividends",
      "discriminator": [
        12,
        163,
        219,
        221,
        178,
        141,
        193,
        63
      ],
      "accounts": [
        {
          "name": "investor",
          "writable": true,
          "signer": true
        },
        {
          "name": "propertyUsdcAccount",
          "writable": true
        },
        {
          "name": "investorUsdcAccount",
          "writable": true
        },
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "investmentAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "transferTokens",
      "discriminator": [
        54,
        180,
        238,
        175,
        74,
        85,
        126,
        188
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "fromTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "toTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "to"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "to"
        },
        {
          "name": "propertyMint",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateProperty",
      "discriminator": [
        232,
        71,
        59,
        188,
        98,
        74,
        94,
        54
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "tokenSymbol",
          "type": "string"
        }
      ]
    },
    {
      "name": "voteOnProposal",
      "discriminator": [
        188,
        239,
        13,
        88,
        119,
        199,
        251,
        119
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "voteRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "vote",
          "type": "bool"
        }
      ]
    },
    {
      "name": "withdrawInvestment",
      "discriminator": [
        157,
        158,
        101,
        11,
        240,
        193,
        192,
        92
      ],
      "accounts": [
        {
          "name": "investor",
          "writable": true,
          "signer": true,
          "relations": [
            "investmentAccount"
          ]
        },
        {
          "name": "investorUsdcAccount",
          "writable": true
        },
        {
          "name": "investmentAccount",
          "writable": true
        },
        {
          "name": "investorPropertyTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "investor"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "property",
          "writable": true,
          "relations": [
            "investmentAccount"
          ]
        },
        {
          "name": "propertyMint",
          "writable": true
        },
        {
          "name": "propertyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "propertyMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "propertyUsdcAccount",
          "writable": true
        },
        {
          "name": "adminUsdcAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "investor",
      "discriminator": [
        174,
        129,
        17,
        83,
        36,
        116,
        26,
        196
      ]
    },
    {
      "name": "property",
      "discriminator": [
        195,
        247,
        69,
        181,
        195,
        47,
        152,
        19
      ]
    },
    {
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33
      ]
    },
    {
      "name": "voteRecord",
      "discriminator": [
        112,
        9,
        123,
        165,
        234,
        9,
        157,
        167
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6001,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6002,
      "name": "propertyClosed",
      "msg": "Property is closed"
    },
    {
      "code": 6003,
      "name": "propertyNotClosed",
      "msg": "Property not closed"
    },
    {
      "code": 6004,
      "name": "tokensRemain",
      "msg": "Tokens remain"
    },
    {
      "code": 6005,
      "name": "noTokensOwned",
      "msg": "No tokens owned"
    },
    {
      "code": 6006,
      "name": "invalidTotalTokens",
      "msg": "Invalid total tokens"
    },
    {
      "code": 6007,
      "name": "invalidTokenPrice",
      "msg": "Invalid token price"
    },
    {
      "code": 6008,
      "name": "invalidPropertyName",
      "msg": "Invalid property name"
    },
    {
      "code": 6009,
      "name": "invalidTokenSymbol",
      "msg": "Invalid token symbol"
    },
    {
      "code": 6010,
      "name": "insufficientAmount",
      "msg": "Insufficient amount"
    },
    {
      "code": 6011,
      "name": "notEnoughTokens",
      "msg": "Not enough tokens"
    },
    {
      "code": 6012,
      "name": "divisionError",
      "msg": "Division error"
    },
    {
      "code": 6013,
      "name": "multiplicationError",
      "msg": "Multiplication error"
    },
    {
      "code": 6014,
      "name": "overflowError",
      "msg": "Overflow error"
    },
    {
      "code": 6015,
      "name": "invalidDividendsClaim",
      "msg": "Invalid dividends claim"
    },
    {
      "code": 6016,
      "name": "noDividendsToClaim",
      "msg": "No dividends to claim"
    },
    {
      "code": 6017,
      "name": "tokensStillInvested",
      "msg": "Tokens still invested"
    },
    {
      "code": 6018,
      "name": "descriptionTooLong",
      "msg": "Description too long"
    },
    {
      "code": 6019,
      "name": "proposalAlreadyExecuted",
      "msg": "Proposal already executed"
    },
    {
      "code": 6020,
      "name": "alreadyVoted",
      "msg": "Proposal already voted"
    },
    {
      "code": 6021,
      "name": "proposalNotApproved",
      "msg": "Proposal not approved"
    },
    {
      "code": 6022,
      "name": "invalidProposalType",
      "msg": "Invalid proposal type"
    },
    {
      "code": 6023,
      "name": "invalidNewAdmin",
      "msg": "Invalid new admin"
    },
    {
      "code": 6024,
      "name": "invalidAdditionalTokens",
      "msg": "Invalid additional tokens"
    },
    {
      "code": 6025,
      "name": "invalidProperty",
      "msg": "Invalid property"
    },
    {
      "code": 6026,
      "name": "tokensAvailable",
      "msg": "Tokens available yet"
    },
    {
      "code": 6027,
      "name": "investorsExist",
      "msg": "Investors exist"
    },
    {
      "code": 6028,
      "name": "dividendsExist",
      "msg": "Dividends exist"
    }
  ],
  "types": [
    {
      "name": "investor",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "investor",
            "type": "pubkey"
          },
          {
            "name": "property",
            "type": "pubkey"
          },
          {
            "name": "tokensOwned",
            "type": "u64"
          },
          {
            "name": "dividendsClaimed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "property",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "propertyName",
            "type": "bytes"
          },
          {
            "name": "totalTokens",
            "type": "u64"
          },
          {
            "name": "availableTokens",
            "type": "u64"
          },
          {
            "name": "tokenPriceUsdc",
            "type": "u64"
          },
          {
            "name": "tokenSymbol",
            "type": "bytes"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "dividendsTotal",
            "type": "u64"
          },
          {
            "name": "isClosed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "property",
            "type": "pubkey"
          },
          {
            "name": "description",
            "type": {
              "array": [
                "u8",
                256
              ]
            }
          },
          {
            "name": "votesFor",
            "type": "u64"
          },
          {
            "name": "votesAgainst",
            "type": "u64"
          },
          {
            "name": "isExecuted",
            "type": "bool"
          },
          {
            "name": "proposalType",
            "type": "u8"
          },
          {
            "name": "newAdmin",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "additionalTokens",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "proposalType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "mintAdditionalTokens"
          },
          {
            "name": "changeAdmin"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "voted",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
