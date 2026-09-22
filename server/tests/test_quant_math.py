import pytest
import numpy as np
import pandas as pd
from core.quant_math import optimize_and_cluster

@pytest.fixture
def synthetic_returns_matrix():
    """Generates 120 days of synthetic returns for 25 tickers across 3 distinct factor regimes."""
    np.random.seed(42)
    n_days = 120
    
    factor_tech = np.random.normal(0.001, 0.02, n_days)
    tech_tickers = {
        f"TECH_{i}": factor_tech + np.random.normal(0, 0.005, n_days)
        for i in range(8)
    }
    
    factor_energy = np.random.normal(-0.0005, 0.015, n_days)
    energy_tickers = {
        f"ENG_{i}": factor_energy + np.random.normal(0, 0.005, n_days)
        for i in range(8)
    }
    
    factor_defensive = np.random.normal(0.0002, 0.008, n_days)
    defensive_tickers = {
        f"DEF_{i}": factor_defensive + np.random.normal(0, 0.003, n_days)
        for i in range(9)
    }
    
    data = {**tech_tickers, **energy_tickers, **defensive_tickers}
    dates = pd.date_range(start="2026-01-01", periods=n_days, freq="B")
    return pd.DataFrame(data, index=dates)

def test_optimize_and_cluster_output_structure(synthetic_returns_matrix):
    """Verifies output types, ticker completeness, and cluster label indexing."""
    best_k, labels_map = optimize_and_cluster(synthetic_returns_matrix, min_k=2, max_k=6)
    
    assert 2 <= best_k <= 6
    assert isinstance(best_k, int)
    
    assert set(labels_map.keys()) == set(synthetic_returns_matrix.columns)
    
    assigned_clusters = set(labels_map.values())
    assert assigned_clusters.issubset(set(range(best_k)))
    assert len(assigned_clusters) == best_k

def test_clustering_isolates_co_moving_assets(synthetic_returns_matrix):
    """Verifies that assets sharing a common synthetic factor map to identical clusters."""
    best_k, labels_map = optimize_and_cluster(synthetic_returns_matrix, min_k=3, max_k=4)
    
    tech_labels = [labels_map[f"TECH_{i}"] for i in range(8)]
    energy_labels = [labels_map[f"ENG_{i}"] for i in range(8)]
    defensive_labels = [labels_map[f"DEF_{i}"] for i in range(9)]
    
    tech_mode = max(set(tech_labels), key=tech_labels.count)
    energy_mode = max(set(energy_labels), key=energy_labels.count)
    defensive_mode = max(set(defensive_labels), key=defensive_labels.count)
    
    assert len({tech_mode, energy_mode, defensive_mode}) == 3

def test_kmeans_deterministic_random_state(synthetic_returns_matrix):
    """Verifies that executions produce identical cluster assignments using the fixed seed."""
    k_first, labels_first = optimize_and_cluster(synthetic_returns_matrix, min_k=3, max_k=5)
    k_second, labels_second = optimize_and_cluster(synthetic_returns_matrix, min_k=3, max_k=5)
    
    assert k_first == k_second
    assert labels_first == labels_second