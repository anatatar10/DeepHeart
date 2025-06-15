package org.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    // Add list of public endpoints that should skip JWT authentication
    private final List<String> publicEndpoints = Arrays.asList(
            "/api/users/signup",
            "/api/users/signin",
            "/api/users/forgot-password",
            "/api/users/verify-reset-token",
            "/api/users/reset-password"
    );

    public JwtAuthenticationFilter(JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        System.out.println("🔍 JWT Filter - Processing request: " + requestURI);

        // Check if this is a public endpoint that should skip JWT authentication
        if (isPublicEndpoint(requestURI)) {
            System.out.println("🔓 JWT Filter - Skipping authentication for public endpoint: " + requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = parseJwt(request);

            if (jwt != null) {
                boolean isValid = jwtUtils.validateJwtToken(jwt);

                if (isValid) {
                    String username = jwtUtils.getUsernameFromJwtToken(jwt);
                    System.out.println("✅ JWT Filter - Valid token for user: " + username);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("✅ Authorities: " + SecurityContextHolder.getContext().getAuthentication().getAuthorities());
                    System.out.println("Security context authentication: " + SecurityContextHolder.getContext().getAuthentication());

                } else {
                    System.err.println("❌ JWT Filter - Token validation failed for: " + requestURI);
                }
            } else {
                System.out.println("⚠️ JWT Filter - No JWT token found for protected endpoint: " + requestURI);
                // Log the authorization header for debugging
                String authHeader = request.getHeader("Authorization");
                System.out.println("Authorization header: " + (authHeader != null ? "Present" : "Missing"));
            }
        } catch (Exception e) {
            System.err.println("❌ JWT Filter - Error processing token for " + requestURI + ": " + e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

    // Helper method to check if endpoint is public
    private boolean isPublicEndpoint(String requestURI) {
        return publicEndpoints.stream().anyMatch(endpoint ->
                requestURI.equals(endpoint) || requestURI.startsWith(endpoint + "/")
        );
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        System.out.println("JWT Filter - parseJwt - Raw Authorization header: " +
                (headerAuth != null ? headerAuth.substring(0, Math.min(headerAuth.length(), 50)) + "..." : "null"));

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7);
            System.out.println("JWT Filter - parseJwt - Extracted token length: " + token.length());
            return token;
        }

        return null;
    }
}