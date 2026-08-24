CREATE TABLE `product_media` (
	`id` varchar(40) NOT NULL,
	`productId` varchar(40) NOT NULL,
	`url` text NOT NULL,
	`storageKey` text NOT NULL,
	`alt` varchar(240),
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`shortDescription` text NOT NULL,
	`fullDescription` text NOT NULL,
	`heroHeadline` text NOT NULL,
	`problem` text NOT NULL,
	`solution` text NOT NULL,
	`outcome` text NOT NULL,
	`category` varchar(160) NOT NULL,
	`productStatus` enum('active','planned','retired') NOT NULL DEFAULT 'active',
	`publicationStatus` enum('draft','published') NOT NULL DEFAULT 'draft',
	`logoUrl` text,
	`logoKey` text,
	`coverUrl` text,
	`coverKey` text,
	`capabilities` json NOT NULL,
	`targetUsers` text NOT NULL,
	`demoUrl` varchar(500),
	`workflowSteps` json NOT NULL,
	`featured` int NOT NULL DEFAULT 0,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`key` varchar(100) NOT NULL,
	`label` varchar(180) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_content_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `product_media` ADD CONSTRAINT `product_media_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `product_media_order_idx` ON `product_media` (`productId`,`displayOrder`);--> statement-breakpoint
CREATE INDEX `products_public_order_idx` ON `products` (`publicationStatus`,`displayOrder`);