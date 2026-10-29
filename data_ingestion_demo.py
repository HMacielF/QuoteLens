import pandas as pd

# Load the sample dataset
df = pd.read_csv("sample_data.csv")

# Display the first five rows
print("Dataset preview:")
print(df.head())

# Report dataset size and columns
print("\nDataset shape:", df.shape)
print("\nColumns:", df.columns.tolist())

# Check for missing values
print("\nMissing values:")
print(df.isnull().sum())

# Save a basic summary
df.describe(include="all").to_csv("data_summary.csv")
print("\nSummary saved to data_summary.csv")
