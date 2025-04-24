package com.example.skillshare.service;

import com.example.skillshare.model.Notification;
import com.example.skillshare.model.User;
import com.example.skillshare.repository.NotificationRepository;
import com.example.skillshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public Page<Notification> getNotificationsByEmail(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    public int getUnreadNotificationsCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    public Notification markNotificationAsRead(String email, String notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to access this notification");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllNotificationsAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(),
                Pageable.unpaged());

        for (Notification notification : notifications) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }
}
