import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from data_prep import fetch_historical_metrics, get_db_connection
import json

def train_match_predictor():
    print("Training ML Match Predictor...")
    df = fetch_historical_metrics()
    
    if df.empty or len(df) < 2:
        print("Not enough data to train the model. Need at least 2 matches.")
        return None, None
        
    # Features (X) and Target (y)
    features = ["xg_diff", "utd_ppda", "opp_ppda", "utd_deep", "opp_deep"]
    X = df[features]
    y = df["win"]
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Logistic Regression Model
    model = LogisticRegression(random_state=42, class_weight='balanced')
    model.fit(X_scaled, y)
    
    accuracy = model.score(X_scaled, y)
    print(f"Model trained successfully. Accuracy on training data: {accuracy:.2f}")
    
    return model, scaler

def push_prediction_to_db(match_id, win_prob, draw_loss_prob):
    print(f"Pushing prediction to DB for Match #{match_id}...")
    conn = get_db_connection()
    
    # Fetch existing teamStats
    query = 'SELECT "teamStats" FROM "Match" WHERE "id" = :match_id'
    rows = conn.run(query, match_id=match_id)
    if not rows:
        print(f"Match #{match_id} not found.")
        conn.close()
        return
        
    existing_stats = rows[0][0]
    if isinstance(existing_stats, str):
        try:
            stats = json.loads(existing_stats)
        except Exception:
            stats = {}
    elif isinstance(existing_stats, dict):
        stats = dict(existing_stats)
    else:
        stats = {}
        
    stats["ai_prediction"] = {
        "win_probability": round(win_prob, 2),
        "draw_loss_probability": round(draw_loss_prob, 2)
    }
    
    update_sql = '''
    UPDATE "Match"
    SET "teamStats" = :stats::jsonb
    WHERE "id" = :match_id;
    '''
    conn.run(update_sql, stats=json.dumps(stats), match_id=match_id)
    conn.close()
    print("Successfully pushed prediction to DB!")

def predict_upcoming_match(model, scaler, opponent_name, utd_xg_avg, opp_xg_avg, utd_ppda_avg, opp_ppda_avg, utd_deep_avg, opp_deep_avg):
    print(f"Predicting win probability vs {opponent_name}...")
    
    # Construct feature vector based on recent averages
    xg_diff = utd_xg_avg - opp_xg_avg
    features = pd.DataFrame([{
        "xg_diff": xg_diff,
        "utd_ppda": utd_ppda_avg,
        "opp_ppda": opp_ppda_avg,
        "utd_deep": utd_deep_avg,
        "opp_deep": opp_deep_avg
    }])
    
    # Scale features
    features_scaled = scaler.transform(features)
    
    # Predict Probability
    prob = model.predict_proba(features_scaled)[0]
    win_prob = prob[1] * 100
    loss_draw_prob = prob[0] * 100
    
    print(f"Match Prediction Result:")
    print(f"  - Manchester United Win: {win_prob:.1f}%")
    print(f"  - Draw/Loss: {loss_draw_prob:.1f}%")
    
    return win_prob, loss_draw_prob

if __name__ == "__main__":
    model, scaler = train_match_predictor()
    if model:
        print("Model coefficients:", model.coef_)
        
        # Test a dummy prediction (e.g., vs Liverpool with dummy form data)
        win_prob, loss_prob = predict_upcoming_match(
            model=model,
            scaler=scaler,
            opponent_name="Liverpool",
            utd_xg_avg=1.8,
            opp_xg_avg=1.4,
            utd_ppda_avg=9.5,
            opp_ppda_avg=11.2,
            utd_deep_avg=8,
            opp_deep_avg=5
        )
        
        # Try pushing to a random match id from the DB (e.g., 692, which was Ipswich)
        # In production this would be an upcoming match
        push_prediction_to_db(692, win_prob, loss_prob)
