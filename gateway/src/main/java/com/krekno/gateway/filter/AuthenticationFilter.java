package com.krekno.gateway.filter;

import com.krekno.gateway.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${app.jwt.jwtCookieName}")
    private String jwtCookieName;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // Allow auth endpoints to bypass authentication
            String path = request.getURI().getPath();
            if (path.contains("/auth/")) {
                return chain.filter(exchange);
            }
            
            // Allow public product catalog browsing
            if (request.getMethod().name().equalsIgnoreCase("GET") && 
               (path.startsWith("/product/api/products") || path.startsWith("/product/api/categories"))) {
                return chain.filter(exchange);
            }
            

            HttpCookie cookie = request.getCookies().getFirst(jwtCookieName);
            String token = null;

            if (cookie != null) {
                token = cookie.getValue();
            } else {
                // Fallback to Authorization header
                List<String> authHeader = request.getHeaders().get("Authorization");
                if (authHeader != null && !authHeader.isEmpty()) {
                    String header = authHeader.get(0);
                    if (header.startsWith("Bearer ")) {
                        token = header.substring(7);
                    }
                }
            }

            if (token == null || !jwtUtils.validateJwtToken(token)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Optionally pass the user email to downstream services
            String email = jwtUtils.getEmailFromJwtToken(token);
            ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                    .header("X-User-Email", email)
                    .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        };
    }

    public static class Config {
        // Put configuration properties here if needed
    }
}
