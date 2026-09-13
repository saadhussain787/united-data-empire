import subprocess
import sys
import os

def run_script(script_path):
    print(f"\n========================================")
    print(f"🚀 Running: {os.path.basename(os.path.dirname(script_path))}/{os.path.basename(script_path)}")
    print(f"========================================\n")
    
    # We use sys.executable to ensure we run with the same python interpreter
    # We pass the directory of the script as cwd so relative paths (like .env) load correctly
    result = subprocess.run(
        [sys.executable, "-X", "utf8", script_path], 
        cwd=os.path.dirname(script_path)
    )
    
    if result.returncode != 0:
        print(f"\n❌ Error: Script exited with code {result.returncode}")
        return False
    return True

if __name__ == "__main__":
    print("\n⚡ STARTING FULL MATCH DATA SYNCHRONIZATION PIPELINE ⚡")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Step 1: Base Match Stats from ESPN
    espn_script = os.path.join(base_dir, "espn_harvester", "app.py")
    
    # Step 2: Advanced Match Stats from Understat
    understat_script = os.path.join(base_dir, "understat_harvester", "dynamic_linker.py")
    
    # Step 3: Match Ratings & Tactical Matrix from FotMob
    fotmob_script = os.path.join(base_dir, "fotmob_harvester", "fotmob_dynamic_linker.py")
    
    if run_script(espn_script):
        print("\n✅ Stage 1 Complete: Base stats synced.")
        print("⏳ Proceeding to Stage 2: Advanced tactical stats enrichment (xG, PPDA)...")
        if run_script(understat_script):
            print("\n✅ Stage 2 Complete: Advanced stats synced.")
            print("⏳ Proceeding to Stage 3: Match Ratings & Tactical Matrix from FotMob...")
            if run_script(fotmob_script):
                print("\n🎉 PIPELINE SUCCESS: All match data is fully synchronized and enriched.")
            else:
                print("\n⚠️ PIPELINE WARNING: FotMob stats enrichment failed.")
        else:
            print("\n⚠️ PIPELINE WARNING: Understat stats enrichment failed.")
    else:
        print("\n❌ PIPELINE ABORTED: Base stats sync failed. Cannot proceed to advanced enrichment.")
