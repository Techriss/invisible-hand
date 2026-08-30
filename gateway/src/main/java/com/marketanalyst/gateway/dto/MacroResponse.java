package com.marketanalyst.gateway.dto;

import java.util.List;

public record MacroResponse(String marketStance, List<String> summaryBullets, List<String> sources) {}