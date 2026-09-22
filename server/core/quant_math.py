from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from logger_config import setup_logger

log = setup_logger("core.quant_math")

RANDOM_STATE = 42
MIN_K = 8
MAX_K = 20
PCA_COMPONENTS = 5

def optimize_and_cluster(returns_df, min_k=MIN_K, max_k=MAX_K) -> tuple:
    """Pure mathematical function to find optimal K-Means clusters via PCA."""
    log.info(f"Optimizing cluster granularity across K={min_k} to K={max_k}...")
    
    scaled_matrix = StandardScaler().fit_transform(returns_df).T
    valid_tickers = returns_df.columns.tolist()
    
    pca_coords = PCA(n_components=PCA_COMPONENTS).fit_transform(scaled_matrix)
    
    best_k = min_k
    best_score = -1.0
    max_possible_k = min(max_k + 1, len(valid_tickers) - 1)
    
    for k in range(min_k, max_possible_k):
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        score = silhouette_score(pca_coords, km.fit_predict(pca_coords))
        if score > best_score:
            best_score = score
            best_k = k
            
    log.info(f"Optimal market structure: K = {best_k}")
    final_labels = KMeans(n_clusters=best_k, random_state=RANDOM_STATE, n_init=10).fit_predict(pca_coords)
    
    return best_k, dict(zip(valid_tickers, final_labels.tolist()))