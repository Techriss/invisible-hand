package com.marketanalyst.gateway.service;

import com.marketanalyst.gateway.dto.AnalysisResponse;
import com.marketanalyst.gateway.mapper.GrpcMapper;
import com.marketanalyst.grpc.AnalysisRequest;
import com.marketanalyst.grpc.StructuralAnalyzerGrpc;

import io.grpc.ManagedChannel;

import org.springframework.stereotype.Service;

@Service
public class AiAnalysisService {

    private final StructuralAnalyzerGrpc.StructuralAnalyzerBlockingStub stub;

    public AiAnalysisService(ManagedChannel channel) {
        this.stub = StructuralAnalyzerGrpc.newBlockingStub(channel);
    }

    public AnalysisResponse fetchReportFromPython(String tickerSymbol) {
        AnalysisRequest request = AnalysisRequest.newBuilder().setTicker(tickerSymbol).build();
        return GrpcMapper.toAnalysisResponse(stub.generateDeepReport(request));
    }
}