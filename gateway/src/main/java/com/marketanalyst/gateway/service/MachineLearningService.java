package com.marketanalyst.gateway.service;

import com.marketanalyst.gateway.dto.ClusterOverviewDto;
import com.marketanalyst.gateway.dto.RelativeValueDto;
import com.marketanalyst.gateway.mapper.GrpcMapper;
import com.marketanalyst.grpc.EmptyRequest;
import com.marketanalyst.grpc.SectorRotationMonitorGrpc;
import com.marketanalyst.grpc.TickerRequest;
import io.grpc.ManagedChannel;
import org.springframework.stereotype.Service;

@Service
public class MachineLearningService {

    private final SectorRotationMonitorGrpc.SectorRotationMonitorBlockingStub stub;

    public MachineLearningService(ManagedChannel channel) {
        this.stub = SectorRotationMonitorGrpc.newBlockingStub(channel);
    }

    public ClusterOverviewDto getMacroClusters() {
        var response = stub.getMidTermClusters(EmptyRequest.newBuilder().build());
        return GrpcMapper.toClusterOverviewDto(response);
    }

    public RelativeValueDto getRelativeValue(String ticker) {
        var response = stub.getRelativeValue(TickerRequest.newBuilder().setTicker(ticker.toUpperCase()).build());
        return GrpcMapper.toRelativeValueDto(response);
    }
}