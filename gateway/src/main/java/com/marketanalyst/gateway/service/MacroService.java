package com.marketanalyst.gateway.service;

import com.marketanalyst.gateway.dto.MacroResponse;
import com.marketanalyst.gateway.mapper.GrpcMapper;
import com.marketanalyst.grpc.MacroRequest;
import com.marketanalyst.grpc.MacroSentimentAnalyzerGrpc;

import io.grpc.ManagedChannel;

import org.springframework.stereotype.Service;

@Service
public class MacroService {

    private final MacroSentimentAnalyzerGrpc.MacroSentimentAnalyzerBlockingStub stub;

    public MacroService(ManagedChannel channel) {
        this.stub = MacroSentimentAnalyzerGrpc.newBlockingStub(channel);
    }

    public MacroResponse fetchMacroSentiment() {
        MacroRequest request = MacroRequest.newBuilder().build();
        return GrpcMapper.toMacroResponse(stub.getGlobalMacro(request));
    }

}