import React from 'react';

export const AOSIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="50" cy="50" r="50" fill="#2563eb" />
        <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            fill="white"
            fontSize="60"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
            fontWeight="bold"
        >
            A
        </text>
    </svg>
);
