CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`confession_id` integer NOT NULL,
	`content` text NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`confession_id`) REFERENCES `confessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_confession_id_idx` ON `comments` (`confession_id`);--> statement-breakpoint
CREATE TABLE `confessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`category` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`has_pii_warning` integer DEFAULT false NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`report_count` integer DEFAULT 0 NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`approved_at` integer
);
--> statement-breakpoint
CREATE INDEX `confessions_status_idx` ON `confessions` (`status`);--> statement-breakpoint
CREATE INDEX `confessions_ip_hash_idx` ON `confessions` (`ip_hash`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`confession_id` integer NOT NULL,
	`reason` text NOT NULL,
	`detail` text,
	`ip_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`confession_id`) REFERENCES `confessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reports_confession_id_idx` ON `reports` (`confession_id`);