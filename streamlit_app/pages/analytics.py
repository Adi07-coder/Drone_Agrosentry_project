import streamlit as st
import pymongo
import pandas as pd
import os
import plotly.express as px

st.set_page_config(page_title="Advanced AI Analytics", page_icon="📈", layout="wide")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/AgroSentryDB")

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client["AgroSentryDB"]
except Exception as e:
    db = None

st.title("📈 Advanced Plant Pathology Analytics")
st.markdown("---")

if db is not None:
    # Load detections
    detections = list(db["detections"].find())
    
    if len(detections) > 0:
        df = pd.DataFrame(detections)
        
        # Calculate stats
        avg_conf = df["confidence"].mean() if "confidence" in df.columns else 0.0
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Average AI Detection Confidence", f"{avg_conf:.2f}%")
            
        st.markdown("### Common Diseases Distribution")
        col_name = "diseaseName" if "diseaseName" in df.columns else ("disease" if "disease" in df.columns else None)
        if col_name:
            disease_counts = df[col_name].value_counts().reset_index()
            disease_counts.columns = ["Disease", "Scans Count"]
            
            fig = px.bar(
                disease_counts,
                x="Scans Count",
                y="Disease",
                orientation='h',
                color="Disease",
                title="Common Scanned Plant Pathologies",
                color_discrete_sequence=["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]
            )
            st.plotly_chart(fig, use_container_width=True)
            
        st.markdown("### Diagnostic Confidence Curves")
        if "confidence" in df.columns and "createdAt" in df.columns:
            fig2 = px.histogram(
                df,
                x="confidence",
                nbins=20,
                title="AI Model Prediction Confidence Histogram",
                color_discrete_sequence=["#10b981"]
            )
            st.plotly_chart(fig2, use_container_width=True)
            
    else:
        st.info("No scan records logged in MongoDB yet. Complete a plant diagnostic scan to populate charts!")
else:
    st.error("Failed to connect to MongoDB.")
