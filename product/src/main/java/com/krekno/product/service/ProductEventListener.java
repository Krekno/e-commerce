package com.krekno.product.service;

import com.krekno.product.entity.Product;
import com.krekno.product.entity.ProductDocument;
import com.krekno.product.repository.ProductRepository;
import com.krekno.product.repository.ProductSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductEventListener {

    private final ProductRepository productRepository;
    private final ProductSearchRepository productSearchRepository;

    @Transactional
    @KafkaListener(topics = "product-events", groupId = "product-search-group")
    public void handleProductEvent(ConsumerRecord<String, String> record) {
        String eventType = record.key();
        String productIdStr = record.value();

        log.info("Received Kafka event. Type: {}, ProductId: {}", eventType, productIdStr);

        try {
            UUID productId = UUID.fromString(productIdStr);
            productRepository.findById(productId).ifPresent(product -> {
                ProductDocument document = mapToDocument(product);
                productSearchRepository.save(document);
                log.info("Indexed product {} into Elasticsearch", productId);
            });
        } catch (Exception e) {
            log.error("Failed to index product into Elasticsearch", e);
        }
    }

    private ProductDocument mapToDocument(Product product) {
        return ProductDocument.builder()
                .id(product.getId().toString())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .sellerEmail(product.getSellerEmail())
                .build();
    }
}
