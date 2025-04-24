package com.example.skillshare.controller;

import com.example.skillshare.model.Notification;
import com.example.skillshare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<Notification>> getCurrentUserNotifications(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.getNotificationsByEmail(currentUser.getUsername(), pageable));
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getUnreadNotificationsCount(
            @AuthenticationPrincipal UserDetails currentUser) {

        return ResponseEntity.ok(notificationService.getUnreadNotificationsCount(currentUser.getUsername()));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markNotificationAsRead(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String notificationId) {

        Notification notification = notificationService.markNotificationAsRead(currentUser.getUsername(),
                notificationId);
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllNotificationsAsRead(
            @AuthenticationPrincipal UserDetails currentUser) {

        notificationService.markAllNotificationsAsRead(currentUser.getUsername());
        return ResponseEntity.ok().build();
    }
}
