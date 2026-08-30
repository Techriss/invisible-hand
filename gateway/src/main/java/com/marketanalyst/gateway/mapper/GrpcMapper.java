package com.marketanalyst.gateway.mapper;

import com.marketanalyst.gateway.dto.*;
import com.marketanalyst.grpc.*;
import java.util.List;

public class GrpcMapper {
    private GrpcMapper() {}

    public static AnalysisResponse toAnalysisResponse(AnalysisReport report) {
        List<AnalysisResponse.Risk> risks = report.getKeyRisksList().stream()
                .map(r -> new AnalysisResponse.Risk(r.getRiskDescription(), r.getSeverityScore(), r.getTimestamp()))
                .toList();

        List<AnalysisResponse.Opportunity> opps = report.getKeyOpportunitiesList().stream()
                .map(o -> new AnalysisResponse.Opportunity(o.getDescription(), o.getConvictionScore(), o.getTimeframe()))
                .toList();

        return new AnalysisResponse(report.getTicker(), report.getExecutiveSummary(), report.getBullCase(), report.getBearCase(), risks, opps, report.getSourcesCitedList(), report.getHypeIndex(), report.getGrahamNumber(), report.getMarginOfSafety(), report.getAltmanZScore(), report.getAltmanZStatus());
    }

    public static ClusterOverviewDto toClusterOverviewDto(ClusterOverviewResponse response) {
        List<ClusterSummaryDto> clusters = response.getClustersList().stream()
                .map(c -> new ClusterSummaryDto(c.getClusterId(), c.getThemeName(), c.getDescription(), c.getConstituentCount(), c.getAverageMomentum(), c.getTopTickersList()))
                .toList();

        return new ClusterOverviewDto(clusters);
    }

    public static RelativeValueDto toRelativeValueDto(RelativeValueResponse response) {
        List<PeerDto> out = response.getOutperformersList().stream().map(p -> new PeerDto(p.getTicker(), p.getCompanyName(), p.getPerformanceSpread())).toList();
        List<PeerDto> lag = response.getLaggardsList().stream().map(p -> new PeerDto(p.getTicker(), p.getCompanyName(), p.getPerformanceSpread())).toList();
        return new RelativeValueDto(response.getTargetTicker(), response.getTargetName(), response.getClusterId(), response.getThemeName(), response.getClusterAverageReturn(), out, lag);
    }

    public static MacroResponse toMacroResponse(MacroReport report) {
        return new MacroResponse(report.getMarketStance(), report.getSummaryBulletsList(), report.getSourcesCitedList());
    }
}