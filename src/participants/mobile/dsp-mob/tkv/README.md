# Building and running the Trusted Key/Value (TKV) service

See the main [`README.md`](/README.md) file for instructions on how to build and run the TKV service. Those instructions will set up a TKV instance that points to the key/value data in this directory.

# Loading your own data into the TKV service

This directory provides pre-loaded data for the TKV for the purposes of this demo. If you'd like to customize the data in the TKV, follow the [instructions](https://github.com/privacysandbox/protected-auction-key-value-service/blob/release-1.0/docs/data_loading/loading_data.md#using-the-cli-tool-to-generate-delta-and-snapshot-files) in the `protected-auction-key-value-service` repo to use the CLI tool to convert a CSV file to a DELTA file.

You can use the `data.csv` file in this directory as a starting point. If the TKV is already running, it will automatically load your DELTA files as you put them into the `deltas` directory.