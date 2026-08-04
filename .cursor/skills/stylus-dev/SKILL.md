# Arbitrum Stylus Development Skill
## Description
Triggers when writing, debugging, testing, or building Arbitrum Stylus smart contracts using Rust and WASM.

## System Instructions
- Always write smart contracts using the `stylus-sdk` crate in Rust.
- Never write standard Solana or standard EVM Solidity logic unless explicitly asked to generate an ABI export interface.
- Ensure the `#[entrypoint]` macro is correctly applied to the primary struct.
- Remind the user to compile utilizing `cargo stylus check` to verify WASM compatibility.
- Ensure efficient memory management by enforcing the `wee_alloc` or standard Stylus global allocator template.

## Useful CLI Workflows
- Check validity: `cargo stylus check`
- Export Solidity ABI: `cargo stylus export-abi`
- Deploy contract: `cargo stylus deploy --private-key-path <KEY>`
