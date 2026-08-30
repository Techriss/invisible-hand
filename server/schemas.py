from pydantic import BaseModel, Field

class RiskFactor(BaseModel):
    risk_description: str = Field(description="The risk description")
    severity_score: float = Field(description="Score from 1.0 to 10.0")
    timestamp: str = Field(description="The exact YYYY-MM-DD date of the news or filing this risk is based on")

class KeyOpportunity(BaseModel):
    description: str = Field(description="The moat or catalyst description")
    conviction_score: float = Field(description="Score from 1.0 to 10.0")
    timeframe: str = Field(description="e.g., 'Near-Term Catalyst', 'Deep Moat'")

class AnalysisReport(BaseModel):
    bull_case: str
    bear_case: str
    key_risks: list[RiskFactor]
    key_opportunities: list[KeyOpportunity]

class ClusterLabel(BaseModel):
    cluster_id: int = Field(description="The integer ID of the cluster")
    theme_name: str = Field(description="A short 2-4 word institutional title")
    description: str = Field(description="One short sentence explaining the macroeconomic mechanism")

class BatchClusterLabels(BaseModel):
    labels: list[ClusterLabel]