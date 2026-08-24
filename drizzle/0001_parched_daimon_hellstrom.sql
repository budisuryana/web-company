CREATE TABLE `activity_logs` (
	`id` varchar(40) NOT NULL,
	`actorOpenId` varchar(64) NOT NULL,
	`actorName` varchar(180),
	`eventType` varchar(80) NOT NULL,
	`resourceType` varchar(64) NOT NULL,
	`resourceId` varchar(190),
	`summary` varchar(500) NOT NULL,
	`detail` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `activity_logs_created_idx` ON `activity_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `activity_logs_resource_idx` ON `activity_logs` (`resourceType`,`resourceId`);