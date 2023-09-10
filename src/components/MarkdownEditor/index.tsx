import React, { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
// import { history, historyKeymap } from '@codemirror/history';
import { syntaxHighlighting } from "@codemirror/language";
import {
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap,
} from '@codemirror/view';
import { EditorState, Compartment, StateCommand } from '@codemirror/state';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { ayuLight } from 'thememirror';
import { defaultKeymap, indentMore, indentLess } from "@codemirror/commands"
// import { uploadImage } from './api'; // Make sure to provide the correct path for your API

const markdownHighlighting = HighlightStyle.define(
    [
        {
            tag: tags.heading1,
            fontSize: "1.6em",
            fontWeight: "bold"
        },
        {
            tag: tags.heading2,
            fontSize: "1.4em",
            fontWeight: "bold",
        },
        {
            tag: tags.heading3,
            fontSize: "1.2em",
            fontWeight: "bold",
        },
    ]
)

function MarkdownEditor({ initialValue, adminSettings, setRendered, handleChangeContent, handleScroll, forceLineNumbers }) {

    const editorRef = useRef(null)

    function findScrollContainer(node: HTMLElement) {
        for (let cur: any = node; cur;) {
            if (cur.scrollHeight <= cur.clientHeight) {
                cur = cur.parentNode
                continue
            }
            return cur
        }
    }

    const [editorView, setEditorView] = useState(null)
    const [lineNumberCptState, setLineNumberCpt] = useState(null)

    useEffect(() => {
        if (!editorRef) return
        const lineNumberCpt = new Compartment();

        const startState = EditorState.create({
            doc: initialValue,
            extensions: [
                ayuLight,
                keymap.of([
                    ...defaultKeymap,
                    {
                        key: "Tab",
                        preventDefault: true,
                        run: indentMore,
                    },
                    {
                        key: "Shift-Tab",
                        preventDefault: true,
                        run: indentLess,
                    },]),
                lineNumberCpt.of([lineNumbers(), basicSetup, EditorView.lineWrapping]),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                syntaxHighlighting(markdownHighlighting),
                markdown({ base: markdownLanguage }),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        setRendered(update.state.doc.toString());
                        handleChangeContent(update.state.doc.toString())
                    }
                }),
                EditorView.domEventHandlers({
                    scroll(event, view) {
                        handleScroll(findScrollContainer(document.querySelector("#markdown > div > div.cm-scroller")).scrollTop / findScrollContainer(document.querySelector("#markdown > div > div.cm-scroller")).scrollHeight)
                    }
                })
            ],
        })

        const view = new EditorView({
            parent: editorRef.current,
            state: startState,
        });

        setEditorView(view)
        setLineNumberCpt(lineNumberCpt)
        return () => view.destroy()
    }, [editorRef]);

    useEffect(() => {
        if (!editorView || !lineNumberCptState) {
            return
        }
        if (forceLineNumbers) {
            editorView.dispatch({
                effects: lineNumberCptState.reconfigure([lineNumbers(), basicSetup, EditorView.lineWrapping])
            })
        } else {
            editorView.dispatch({
                effects: lineNumberCptState.reconfigure([])
            })
        }
    }, [editorView, forceLineNumbers])

    useEffect(() => {
        if (!editorView || !initialValue) {
            return
        }
        const transaction = editorView.state.update({
            changes: {
                from: 0,
                to: editorView.state.doc.length,
                insert: initialValue,
            },
            selection: editorView.state.selection,
        })

        editorView.dispatch(transaction)

    }, [initialValue, editorView])

    return [editorRef, editorView];
}

export default MarkdownEditor