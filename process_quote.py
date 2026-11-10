import re

text = """
We propose to furnish and install approximately
46 square feet of Calacatta-look quartz surfaces.
Our bundled project price is $3,950.00.
"""

# Extract square footage
sqft_match = re.search(r"(\d+)\s+square feet", text)

# Extract total price
price_match = re.search(
    r"project price is \$([\d,]+\.\d{2})",
    text
)

if sqft_match and price_match:
    square_feet = int(sqft_match.group(1))
    total_price = float(
        price_match.group(1).replace(",", "")
    )

    print("Square footage:", square_feet)
    print("Total price:", total_price)
    print("Cost per sqft:", round(total_price / square_feet, 2))