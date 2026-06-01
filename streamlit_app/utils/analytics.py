import pandas as pd

def process_analytics(data):
    """
    Helper function to process raw MongoDB data into pandas DataFrames 
    for Streamlit charting if needed separately from React.
    """
    if not data:
        return pd.DataFrame()
    return pd.DataFrame(data)
