import streamlit as st
import streamlit.components.v1 as components
import os

def render_react_frontend():
    """
    Embeds the React frontend inside the Streamlit app.
    It points to the local Vite development server by default.
    """
    REACT_URL = os.getenv("REACT_APP_URL", "http://localhost:5173")
    
    # Hide standard Streamlit header and padding to make the embed seamless
    st.markdown("""
        <style>
            .block-container {
                padding-top: 0rem;
                padding-bottom: 0rem;
                padding-left: 0rem;
                padding-right: 0rem;
            }
            header {visibility: hidden;}
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            iframe {
                border: none;
                width: 100vw;
                height: 100vh;
            }
        </style>
    """, unsafe_allow_html=True)

    components.iframe(REACT_URL, height=1000, scrolling=True)
