import streamlit as st
from frontend_embed.react_embed import render_react_frontend

st.set_page_config(
    page_title="Dashboard - AgroSentry",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Render the React frontend
render_react_frontend()
